import { AppState, WebDAVConfig } from '../types';

const DEFAULT_FILENAME = 'weekly_keeper_data.json';

// Helper to handle UTF-8 strings in Base64 (correctly handles special chars in passwords)
const utf8_to_b64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const getHeaders = (config: WebDAVConfig) => {
  // Use UTF-8 safe encoding for credentials
  const auth = utf8_to_b64(`${config.username}:${config.password}`);
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };
};

const getFullUrl = (config: WebDAVConfig) => {
  let url = config.url.trim();
  if (!url) throw new Error("WebDAV URL is empty");
  if (!url.endsWith('/')) url += '/';
  const filename = config.filename || DEFAULT_FILENAME;
  return url + filename;
};

export const uploadToWebDAV = async (data: AppState, config: WebDAVConfig): Promise<boolean> => {
  if (!config.enabled || !config.url) return false;

  try {
    const url = getFullUrl(config);
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(config),
      body: JSON.stringify(data),
      mode: 'cors', // Explicitly request CORS
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      console.log('WebDAV Upload Successful');
      return true;
    } else {
      console.error('WebDAV Upload Failed', response.status, response.statusText);
      throw new Error(`服务器返回 ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('WebDAV Error:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
       throw new Error('连接被拒绝 (CORS跨域限制)。\n注意：坚果云等部分网盘不支持网页直接访问，请使用支持CORS的自建服务(如Nextcloud)或本地代理。');
    }
    throw error;
  }
};

export const downloadFromWebDAV = async (config: WebDAVConfig): Promise<AppState | null> => {
  if (!config.url) throw new Error("Missing URL");

  try {
    const url = getFullUrl(config);
    // Add a timestamp to prevent caching
    const fetchUrl = `${url}?t=${new Date().getTime()}`;
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: getHeaders(config),
      mode: 'cors',
    });

    if (response.ok) {
      const data = await response.json();
      return data as AppState;
    } else if (response.status === 404) {
      console.warn('WebDAV file not found (404)');
      return null;
    } else {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('WebDAV Download Error:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
       throw new Error('连接被拒绝 (CORS跨域限制)。\n注意：坚果云等部分网盘不支持网页直接访问，请使用支持CORS的自建服务(如Nextcloud)或本地代理。');
    }
    throw error;
  }
};