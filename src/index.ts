import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the jupyterlab_genv extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_genv:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
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
  }
};

export default plugin;
