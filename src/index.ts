import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  ToolbarButton
} from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';

import { IDisposable } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';

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
      onClick: () => {
        requestAPI<any>('set_indices')
          .then(data => {
            console.log(data);
            alert('GPU indices set. Restart the kernel.');
          })
          .catch(reason => {
            console.error(
              `The jupyterlab_genv server extension appears to be missing.\n${reason}`
            );
          });
      }
    });

    // Add the toolbar button to the notebook toolbar
    panel.toolbar.insertItem(10, 'mybutton', mybutton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return mybutton;
  }
}

/**
 * Initialization data for the jupyterlab_genv extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_genv:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    console.log('JupyterLab extension jupyterlab_genv is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyterlab_genv server extension appears to be missing.\n${reason}`
        );
      });

    // Create a blank content widget inside of a MainAreaWidget
    const your_button = new ButtonExtension();
    app.docRegistry.addWidgetExtension('Notebook', your_button);

    const content = new Widget();
    const widget = new MainAreaWidget({ content });
    widget.id = 'genv-jupyterlab';
    widget.title.label = 'GPUs';
    widget.title.closable = true;

    const p = document.createElement('p');
    content.node.appendChild(p);
    p.innerText = 'Hello from genv extension';

    // Add an application command
    const command = 'genv:open';
    app.commands.addCommand(command, {
      label: 'GPUs: Open Widget',
      execute: () => {
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    // Add the command to the palette.
    palette.addItem({ command, category: 'GPUs' });
  }
};

export default plugin;
