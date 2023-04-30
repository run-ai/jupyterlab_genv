import jupyter_client
import os
from typing import Any, Dict

from . import genv

class GenvProvisioner(jupyter_client.LocalProvisioner):
    async def pre_launch(self, **kwargs: Any) -> Dict[str, Any]:
        eid = await genv.envs.find(self.kernel_id) or self.kernel_id
        indices = await genv.devices.find(eid)

        env = kwargs.pop('env', os.environ).copy()
        env.update({ 'CUDA_VISIBLE_DEVICES': ','.join(str(index) for index in indices) })
        # TODO(raz): add 'shims' to PATH so that nvidia-smi shim would run
        kwargs['env'] = env

        return await super().pre_launch(**kwargs)
