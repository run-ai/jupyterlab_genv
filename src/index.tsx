import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  ToolbarButton
} from '@jupyterlab/apputils';

import { refreshIcon } from '@jupyterlab/ui-components';

import { Kernel } from '@jupyterlab/services';
import { ITerminal } from '@jupyterlab/terminal';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';
import { Message } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';

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
    app.shell.add(terminal, 'main', { mode: 'split-bottom' });

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
          'eval "$(genv init -)"',
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

class DevicesWidget extends Widget {
  private div?: HTMLDivElement;

  async onUpdateRequest(_msg: Message): Promise<void> {
    const devices = await Handler.devices();

    if (this.div) {
      this.node.removeChild(this.div);
    }

    this.div = document.createElement('div');
    this.node.appendChild(this.div);

    for (const index in devices) {
      const device = devices[index];
      const div = document.createElement('div');

      if (device.eid) {
        div.innerText = `GPU ${index}: used by environment ${device.eid}`;
      } else {
        div.innerText = `GPU ${index}: available`;
      }

      this.div.appendChild(div);
    }
  }
}

class EnvsWidget extends Widget {
  private div?: HTMLDivElement;

  async onUpdateRequest(_msg: Message): Promise<void> {
    const envs = await Handler.envs();

    if (this.div) {
      this.node.removeChild(this.div);
    }

    this.div = document.createElement('div');
    this.node.appendChild(this.div);

    for (const env of envs) {
      const div = document.createElement('div');

      div.innerText = `${env.eid} ${env.user}`;

      if (env.name) {
        div.innerText += ` ${env.name}`;
      }

      this.div.appendChild(div);
    }
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_genv:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  activate: async (app: JupyterFrontEnd, palette: ICommandPalette) => {
    app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(app));

    const devicesContent = new DevicesWidget();
    const devicesWidget = new MainAreaWidget({ content: devicesContent });

    devicesWidget.id = 'jupyterlab_genv.devices';
    devicesWidget.title.label = 'GPUs: Devices';
    devicesWidget.title.closable = true;
    devicesWidget.toolbar.insertItem(
      0,
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        tooltip: 'Refresh',
        onClick: () => {
          devicesContent.update();
        }
      })
    );

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

    const envsContent = new EnvsWidget();
    const envsWidget = new MainAreaWidget({ content: envsContent });

    envsWidget.id = 'jupyterlab_genv.envs';
    envsWidget.title.label = 'GPUs: Environments';
    envsWidget.title.closable = true;
    envsWidget.toolbar.insertItem(
      0,
      'refresh',
      new ToolbarButton({
        icon: refreshIcon,
        tooltip: 'Refresh',
        onClick: () => {
          envsContent.update();
        }
      })
    );

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
