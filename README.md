# GPU Environment Management for JupyterLab  [![Join the community at https://join.slack.com/t/genvcommunity/shared_invite/zt-1i70tphdc-DmFgK5yr3HFI8Txx1yFXBw](https://img.shields.io/badge/Slack-genv-ff007f?logo=slack)](https://join.slack.com/t/genvcommunity/shared_invite/zt-1i70tphdc-DmFgK5yr3HFI8Txx1yFXBw) [![Join the chat at https://gitter.im/run-ai-genv/community](https://badges.gitter.im/run-ai-genv/community.svg)](https://gitter.im/run-ai-genv/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


[![Github Actions Status](https://github.com/run-ai/jupyterlab_genv/workflows/Build/badge.svg)](https://github.com/run-ai/jupyterlab_genv/actions/workflows/build.yml)

A JupyterLab extension for managing GPU environments using [genv](https://github.com/run-ai/genv).

The [_genv_](https://github.com/run-ai/genv) extension lets you interactively control, configure and monitor the GPU resources that your Jupyter Notebooks are using.

![Overview](/resources/readme/overview.gif)

## 🏃🏻 Be an early runner in the genv community!

[<img src="https://img.shields.io/badge/Slack-Join%20the%20community!-ff007f?style=for-the-badge&logo=slack&logoColor=ff007f" height="30" />](https://join.slack.com/t/genvcommunity/shared_invite/zt-1i70tphdc-DmFgK5yr3HFI8Txx1yFXBw)

Join our Slack channel with the creators of *genv* and start building your models faster!

- Installation and setup support as well as best practice tips and tricks directly for your use-case
- Discuss possible features
- Monthly coffee breaks to get to know the rest of the community

Looking forward to seeing you as a part of the community!


## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
  - [Pip](#pip)
  - [Install _genv_ Kernels](#install-genv-kernels)
- [Usage](#usage)
  - [Activate Your Environment](#activate-your-environment)
  - [Attach GPUs to Your Environment](#attach-gpus-to-your-environment)
  - [See Devices and Environments](#see-devices-and-environments)
- [Development](#development)
- [Publish](#publish)

## Getting Started

Read the _genv_ [reference](https://github.com/run-ai/genv#usage) to get started.

## Installation

### Requirements

JupyterLab >= 3.0

### Pip

You can install `jupyterlab_genv` from [PyPI](https://pypi.org/project/jupyterlab-genv/) using `pip`:

```bash
pip install jupyterlab_genv
```

### Install _genv_ Kernels

After installing `jupyterlab_genv`, you will need to install _genv_ Jupyter kernels using:

```bash
python -m jupyterlab_genv install
```

## Usage

### Activate Your Environment

To activate your environment, you will have to select a _genv_ [kernel](#install-genv-kernels).

Then, click the `GPUs` button on the Jupyter Notebook toolbar.
A dialog should pop up where you can choose either to create a new environment for your Jupyter Notebook, or to use an existing one.

Then, you can open a terminal activated in your environment.
From there you will be able to configure the environment and attach devices.

![Activate](/resources/readme/activate.gif)

### Attach GPUs to Your Environment

Configuring the environment and attaching devices is done from the _genv_ terminal.

Make sure to restart your kernel after running the command in the terminal for it to take effect.

![Attach](/resources/readme/attach.gif)

### See Devices and Environments

You can open the devices and environments widgets to see information.

Open the command palette (`Command/Ctrl Shift C`) and type `GPUs`.

![Commands](/resources/readme/commands.gif)

## Development

### Setup

You will need to create a virtual environment once using the command:

```bash
conda create -n jupyterlab_genv --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=3 cookiecutter nodejs jupyter-packaging git
```

Then, activate the virtual environment when you want to work on the project:

```bash
conda activate jupyterlab_genv
```

### Install

Use the following commands to install the Python package and enable it in JupyterLab:

```bash
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterlab_genv
```

If you make any changes you will need to rebuild the extension Typescript source using:

```
jlpm build
```

Alternatively, you can watch the source directory using:

```
jlpm watch
```

With the `jlpm watch` command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

### Run

Run JupyterLab using the command:

```bash
jupyter lab
```

> Running `SHELL=bash jupyter lab --no-browser` is even better

### Uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyterlab_genv
pip uninstall jupyterlab_genv
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop` command.
To find its location, you can run `jupyter labextension list` to figure out where the `labextensions` folder is located.
Then you can remove the symlink named `jupyterlab_genv` within that folder.

### Reference

#### List all kernel provisioners

```bash
jupyter kernelspec provisioners
```

#### Install a kernel provisioner

To add a kernel provisioner to a kernel spec, edit its `kernel.json` file.
For example, to install a kernel provisioner for the `python3` kernel spec, run:

```bash
vim $CONDA_PREFIX/share/jupyter/kernels/python3/kernel.json
```

And add:

```
"metadata": {
  "kernel_provisioner": {
    "provisioner_name": "genv-provisioner"
  }
}
```

#### List all available kernel specs

```bash
ls -la $CONDA_PREFIX/share/jupyter/kernels/
```

#### List all running kernels

```bash
ls -la $(jupyter --runtime-dir)/kernel-*.json
```

#### List Jupyter server extensions

```bash
jupyter server extension list
```

#### List JupyterLab extensions

```bash
jupyter labextension list
```

## Publish

The Python package is manually published to both [PyPI](https://pypi.org/project/jupyterlab-genv/) and [conda-forge](https://conda-forge.org/).

We do not publish the frontend part as an npm package because the Python package is a prebuilt server extension, and the frontend part alone is useless.

Also make sure to update the [changelog](./CHANGELOG.md) ([here's](https://keepachangelog.com/en/1.0.0/#how) how).

### PyPI

#### Prerequisites

```bash
pip install build twine tbump
```

#### Bump Version

The [cookiecutter template](https://github.com/jupyterlab/extension-cookiecutter-ts) uses `tbump` for bumping the version.
However, for some reason this does not work at the moment, and we bump the version manually.

Search for the current version in the project files and replace the relevant instances.
Here is a list of files that you should update:

- [package.json](package.json#L3)
- [package-lock.json](package-lock.json#L3)
- [pyproject.toml](pyproject.toml#L7) (also [here](pyproject.toml#L84) for future `tbump` support)
- [jupyterlab_genv/\_version.py](jupyterlab_genv/_version.py#L6)

#### Create a Python Package

Create a Python source package (`.tar.gz`) and the binary package (`.whl`) in the `dist/` directory using:

```bash
python -m build
```

> `python setup.py sdist bdist_wheel` is deprecated and will not work for this package.

Then, upload the package to [PyPI](https://pypi.org/project/jupyterlab-genv/) using:

```bash
twine upload dist/*
```
