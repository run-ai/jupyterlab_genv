import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  ToolbarButton,
  ReactWidget
} from '@jupyterlab/apputils';

import { Kernel } from '@jupyterlab/services';
import { ITerminal } from '@jupyterlab/terminal';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';

import React from 'react';

import { Handler } from './handler';

import { Dialogs } from './dialogs';

async function openTerminal(eid: string, app: JupyterFrontEnd): Promise<void> {
  // NOTE(raz): the terminal is returned only when it's created in the first time.
  //    this means that we can't send commands to the terminal if it's already running.
  //    we should consider either creating a terminal per kernel or fixing this.
  //    we tried opening a terminal per kernel but it seems like terminal names can't
  //    be long enough to contain a kernel identifier.
  //    here's a reference:
  //    https://github.com/jupyterlab/jupyterlab/blob/v3.4.7/packages/terminal-extension/src/index.ts#L323
  const terminal: MainAreaWidget<ITerminal.ITerminal> | undefined =
    await app.commands.execute('terminal:open', { name: 'genv' });

  if (terminal) {
    terminal.content.session.send({
      type: 'stdin',
      content: [
        [
          '# this is a terminal for configuring your genv environment.',
          '# it will be activated in your environment.',
          '# you can configure your environment and attach devices from here.',
          '# ',
          '# you can start with running the following command:',
          '# ',
          '#     genv attach --help',
          '# ',
          '# for more information check out the reference at https://github.com/run-ai/genv',
          '# ',
          '# IMPORTANT: you will need to restart your Jupyter kernel after configuring the environment from the terminal.',
          '',
          `genv activate --id ${eid}`
        ]
          .map(line => line + '\n')
          .join('')
      ]
    });
  }
}

async function handleClick(
  kernel: Kernel.IKernelConnection | null | undefined,
  app: JupyterFrontEnd
) {
  if (kernel) {
    const spec = await kernel.spec;

    if (spec?.name.endsWith('-genv')) {
      let eid: string | null = await Handler.find(kernel.id);

      if (!eid) {
        const envs = await Handler.envs();

        eid = await Dialogs.activate(envs, kernel.id);

        if (eid) {
          await Handler.activate(kernel.id, eid);
        }
      }

      if (eid) {
        if (await Dialogs.configure(eid)) {
          await openTerminal(eid, app);
        }
      }
    } else {
      if (await Dialogs.notSupportedKernel()) {
        await app.commands.execute('notebook:change-kernel');
      }
    }
  } else {
    if (await Dialogs.noKernel()) {
      await app.commands.execute('notebook:change-kernel');
    }
  }
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
        await handleClick(panel.sessionContext.session?.kernel, this._app);
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

    const devicesInfos = await Handler.devices();
    const devicesWidget = new MainAreaWidget({
      content: ReactWidget.create(
        <>
          {devicesInfos.map((device: { eid: string }, i: number) => (
            <div>
              GPU {i}:{' '}
              {device.eid === '' ? (
                <span style={{ color: 'green' }}>available</span>
              ) : (
                <span>used by enviornment {device.eid}</span>
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

    const envsInfos = await Handler.envs();
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
