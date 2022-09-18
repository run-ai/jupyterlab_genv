import argparse
import json
import os
import shutil

import jupyter_client.kernelspec

def do_install() -> None:
    kernel_specs = jupyter_client.kernelspec.find_kernel_specs()

    for kernel_spec_name, kernel_spec_dir in kernel_specs.items():
        if kernel_spec_name.endswith('-genv') or f'{kernel_spec_name}-genv' in kernel_specs:
            continue

        dst = f'{kernel_spec_dir}-genv'

        print(f'Installing genv wrapper for kernel spec "{kernel_spec_name}" at {dst}')

        shutil.copytree(kernel_spec_dir, dst)

        kernel_json_path = f'{os.path.join(dst, "kernel.json")}'

        with open(kernel_json_path, 'r') as f:
            kernel_json = json.load(f)

        kernel_json['display_name'] = f"{kernel_json['display_name']} (genv)"

        if 'metadata' not in kernel_json:
            kernel_json['metadata'] = {}

        kernel_json['metadata']['kernel_provisioner'] = { 'provisioner_name': 'genv-provisioner' }

        with open(kernel_json_path, 'w') as f:
            json.dump(kernel_json, f, indent=1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=f'JupyterLab genv extension')
    subparsers = parser.add_subparsers(dest='command', required=True)
    subparsers.add_parser('install', help='Install genv kernel specs')
    args = parser.parse_args()

    if args.command == 'install':
        do_install()
