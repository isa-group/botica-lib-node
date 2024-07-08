export function schedule(
  callback: Function,
  initialDelay: number,
  delay: number,
): NodeJS.Timeout {
  return setTimeout(() => {
    callback();
    setInterval(callback, delay);
  }, initialDelay);
}
