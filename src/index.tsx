import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  ToolbarButton,
  Dialog,
  showDialog,
  ReactWidget
} from '@jupyterlab/apputils';

import { ITerminal } from '@jupyterlab/terminal';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';

import React from 'react';

import { requestAPI } from './handler';
import { Env } from './models/env';

async function activate(kernel_id: string, eid: string) {
  const body = JSON.stringify({
    eid: eid,
    kernel_id: kernel_id
  });

  await requestAPI('activate', {
    body: body,
    method: 'POST'
  });
}

function Configuration(props: { kernel_id: string; envs: Env[] }): JSX.Element {
  function Existing(): JSX.Element {
    return (
      <>
        <h3>Attach to existing environment</h3>
        {props.envs.map(env => (
          <div>
            {env.eid}
            <button
              className="jp-Dialog-button jp-mod-styled jp-mod-accept"
              onClick={async () => await activate(props.kernel_id, env.eid)}
            >
              Use
            </button>
          </div>
        ))}
      </>
    );
  }

  function Terminal(): JSX.Element {
    return (
      <>
        <h3>Create a new environment</h3>
        Open a terminal and run the following command:
        <br />
        <br />
        <code>genv activate --id {props.kernel_id}</code>
        <br />
        Then, configure the environment with normal genv commands.
        <br />
        If you are not familiar with how to configure genv environments, check
        out the genv reference at https://github.com/run-ai/genv.
        <br />
        <br />
        <i>IMPORTANT:</i>
        You will need to restart the kernel for changes form the terminal to
        effect.
      </>
    );
  }

  return (
    <>
      {props.envs.length > 0 ? <Existing /> : <></>}
      <Terminal />
    </>
  );
}

export class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  constructor(app: JupyterFrontEnd) {
    this._app = app;
  }

  createNew(
    panel: NotebookPanel,
    _context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    // Create the toolbar button
    const mybutton = new ToolbarButton({
      label: 'GPUs',
      tooltip: 'Configure the GPU environment',
      onClick: async () => {
        if (panel.sessionContext.session?.kernel) {
          const spec = await panel.sessionContext.session.kernel.spec;

          if (spec?.name.endsWith('-genv')) {
            const envs = await requestAPI<Env[]>('envs');
            const result = await showDialog({
              title: 'Configure The GPU Environment',
              body: ReactWidget.create(
                <Configuration
                  kernel_id={panel.sessionContext.session.kernel.id}
                  envs={envs}
                />
              ),
              buttons: [
                Dialog.cancelButton({ label: 'Later' }),
                Dialog.okButton({
                  label: 'Open a terminal',
                  accept: true
                })
              ]
            });

            if (result.button.accept) {
              // NOTE(raz): the terminal is returned only when it's created in the first time.
              //    this means that we can't send commands to the terminal if it's already running.
              //    we should consider either creating a terminal per kernel or fixing this.
              //    we tried opening a terminal per kernel but it seems like terminal names can't
              //    be long enough to contain a kernel identifier.
              //    here's a reference:
              //    https://github.com/jupyterlab/jupyterlab/blob/v3.4.7/packages/terminal-extension/src/index.ts#L323
              const terminal: MainAreaWidget<ITerminal.ITerminal> | undefined =
                await this._app.commands.execute('terminal:open', {
                  name: 'genv'
                });

              if (terminal) {
                terminal.content.session.send({
                  type: 'stdin',
                  content: [
                    `genv activate --id ${panel.sessionContext.session.kernel.id}\n`
                  ]
                });
              }
            }
          } else {
            await showDialog({
              title: 'Not a genv Kernel',
              body: ReactWidget.create(
                <>
                  Please select a genv kernel.
                  <br />
                  If you don't have any, run the following command:
                  <br />
                  <br />
                  <code>python -m jupyterlab_genv install</code>
                </>
              ),
              buttons: [Dialog.warnButton()]
            });
          }
        } else {
          await showDialog({
            title: 'No Kernel',
            body: 'You need a kernel in order to run in a GPU environment.',
            buttons: [Dialog.warnButton()]
          });
        }
      }
    });

    // Add the toolbar button to the notebook toolbar
    panel.toolbar.insertItem(10, 'mybutton', mybutton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return mybutton;
  }

  private _app;
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_genv:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  activate: async (app: JupyterFrontEnd, palette: ICommandPalette) => {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(app));

    const devicesInfos = await requestAPI<any>('devices');
    const devicesWidget = new MainAreaWidget({
      content: ReactWidget.create(
        <>
          {devicesInfos.map((device: any, i: number) => (
            <div>
              GPU {i}:{' '}
              {device['eid'] === '' ? (
                <span style={{ color: 'green' }}>available</span>
              ) : (
                <span>used by enviornment {device['eid']}</span>
              )}
            </div>
          ))}
        </>
      )
    });

    devicesWidget.id = 'jupyterlab_genv.devices';
    devicesWidget.title.label = 'GPUs: Devices';
    devicesWidget.title.closable = true;

    const devicesCommand = 'jupyterlab_genv.devices.open';
    app.commands.addCommand(devicesCommand, {
      label: 'GPUs: Show Devices',
      execute: () => {
        if (!devicesWidget.isAttached) {
          app.shell.add(devicesWidget, 'main');
        }

        app.shell.activateById(devicesWidget.id);
      }
    });

    palette.addItem({ command: devicesCommand, category: 'GPUs' });

    const envsInfos = await requestAPI<any>('envs');
    const envsWidget = new MainAreaWidget({
      content: ReactWidget.create(
        <>
          {envsInfos.map((env: any) => (
            <div>
              {`${env['eid']} ${env['user']}`}
              {env['name'] !== '' ? ` ${env['name']}` : null}
            </div>
          ))}
        </>
      )
    });

    envsWidget.id = 'jupyterlab_genv.envs';
    envsWidget.title.label = 'GPUs: Environments';
    envsWidget.title.closable = true;

    const envsCommand = 'jupyterlab_genv.envs.open';
    app.commands.addCommand(envsCommand, {
      label: 'GPUs: Show Environments',
      execute: () => {
        if (!envsWidget.isAttached) {
          app.shell.add(envsWidget, 'main');
        }

        app.shell.activateById(envsWidget.id);
      }
    });

    palette.addItem({ command: envsCommand, category: 'GPUs' });
  }
};

export default plugin;
