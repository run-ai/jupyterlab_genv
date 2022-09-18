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

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';

import React from 'react';

import { requestAPI } from './handler';

export class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  createNew(
    panel: NotebookPanel,
    _context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    // Create the toolbar button
    const mybutton = new ToolbarButton({
      label: 'GPUs',
      tooltip: 'Configure this GPU environment',
      onClick: async () => {
        if (panel.sessionContext.session?.kernel) {
          await showDialog({
            title: 'Configure Your GPU Environment',
            body: ReactWidget.create(
              <>
                Open a terminal and run the following command:
                <br />
                <br />
                <code>
                  genv activate --id kernel-
                  {panel.sessionContext.session.kernel.id}
                </code>
                <br />
                <i>IMPORTANT:</i>
                You will need to restart the kernel for changes form the
                terminal to take effect.
              </>
            ),
            buttons: [Dialog.okButton()]
          });
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
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_genv:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  activate: async (app: JupyterFrontEnd, palette: ICommandPalette) => {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());

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
