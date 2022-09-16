import jupyter_client
import os
from typing import Any, Dict

from . import genv

class GenvProvisioner(jupyter_client.LocalProvisioner):
    async def pre_launch(self, **kwargs: Any) -> Dict[str, Any]:
        indices = await genv.devices.query(eid=f'kernel-{self.kernel_id}')

        env = kwargs.pop('env', os.environ).copy()
        env.update({ 'CUDA_VISIBLE_DEVICES': ','.join(str(index) for index in indices) })
        kwargs['env'] = env

        return await super().pre_launch(**kwargs)
