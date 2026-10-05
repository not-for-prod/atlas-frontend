export function backendOrigin() {
  const value = process.env.NEXT_PUBLIC_ATLAS_BACKEND_URL;
  if (!value) throw new Error('Backend URL is not configured');
  try {
    const url = new URL(value);
    if (
      url.origin !== value ||
      url.username ||
      url.password ||
      !(
        url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      )
    )
      throw new Error();
    return value;
  } catch {
    throw new Error('Backend URL is not configured');
  }
}
