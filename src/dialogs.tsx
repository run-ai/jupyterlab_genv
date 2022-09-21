import {
  Dialog,
  InputDialog,
  showDialog,
  ReactWidget
} from '@jupyterlab/apputils';

import React from 'react';

export namespace Dialogs {
  export async function noKernel(): Promise<void> {
    await showDialog({
      title: 'No Kernel',
      body: 'You need a kernel in order to run in a GPU environment.',
      buttons: [Dialog.warnButton()]
    });
  }

  export async function notSupportedKernel(): Promise<void> {
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

  export async function activate(
    envs: { eid: string }[],
    kernel_id: string
  ): Promise<string | null> {
    const placeholder = 'Create a new environment';

    let { value } = await InputDialog.getItem({
      title: 'Activate GPU Environment',
      items: [placeholder, ...envs.map(env => env.eid)],
      okLabel: 'Next'
    });

    if (value === placeholder) {
      value = kernel_id;
    }

    return value;
  }

  export async function configure(eid: string): Promise<boolean> {
    const { button } = await showDialog({
      title: 'Configure GPU Environment',
      body: ReactWidget.create(
        <>
          Open a terminal and run the following command:
          <br />
          <br />
          <code>genv activate --id {eid}</code>
          <br />
          Then, configure the environment with normal genv commands.
          <br />
          <br />
          If you are not familiar with how to configure genv environments, check
          out the genv reference.
          <br />
          You can find it at https://github.com/run-ai/genv.
          <br />
          <br />
          <b>IMPORTANT</b>
          You will need to restart the kernel for changes form the terminal to
          effect.
        </>
      ),
      buttons: [
        Dialog.cancelButton({ label: 'Later' }),
        Dialog.okButton({ label: 'Open a terminal' })
      ]
    });

    return button.accept;
  }
}
