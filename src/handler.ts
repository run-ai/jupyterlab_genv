import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'jupyterlab-genv', // API Namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export namespace Handler {
  export async function activate(
    kernel_id: string,
    eid: string
  ): Promise<void> {
    const body = JSON.stringify({
      eid: eid,
      kernel_id: kernel_id
    });

    await requestAPI('activate', {
      body: body,
      method: 'POST'
    });
  }

  export async function devices(): Promise<{ eid: string }[]> {
    return await requestAPI('devices');
  }

  export async function envs(): Promise<{ eid: string }[]> {
    return await requestAPI('envs');
  }

  export async function find(kernel_id: string): Promise<string | null> {
    return (await requestAPI<string>(`find?kernel_id=${kernel_id}`)) || null;
  }
}
