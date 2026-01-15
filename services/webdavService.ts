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
    // OPTIMIZATION: Removed 'Content-Type': 'application/json'
    // WebDAV servers usually ignore this for storage or detect via extension (.json).
    // Removing it simplifies the CORS preflight check (fewer headers to validate).
  };
};

const getFullUrl = (config: WebDAVConfig) => {
  let url = config.url.trim();
  if (!url) throw new Error("WebDAV URL is empty");
  
  // Mixed Content Check
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.toLowerCase().startsWith('http:')) {
      throw new Error("安全策略限制 (Mixed Content)：\n当前网页运行在 HTTPS 环境，浏览器为了安全，强制禁止直接访问不加密的 HTTP 服务器。\n\n解决方法：\n1. 请使用 https:// 开头的 WebDAV 地址。\n2. 或者给您的服务器配置 SSL 证书。");
  }

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
    if (error.message && error.message.includes('Mixed Content')) {
        throw error;
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
       // Enhanced error message for Nginx/Panel CORS pitfalls
       throw new Error('连接被中断 (Failed to fetch)。\n\n如果您使用宝塔/aaPanel，请注意 Nginx 的陷阱：\n如果 "反向代理" 配置文件内部有任何 add_header 指令，您在外部添加的 CORS 头会被直接忽略。\n\n解决办法：请将 CORS 配置直接粘贴到 Nginx 代理配置文件(proxy/*.conf)的内部，紧跟在 proxy_pass 下方。');
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
    if (error.message && error.message.includes('Mixed Content')) {
        throw error;
    }
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
       throw new Error('连接失败 (CORS)。请检查 Nginx 代理配置是否覆盖了 Access-Control-Allow-Headers 头。');
    }
    throw error;
  }
};