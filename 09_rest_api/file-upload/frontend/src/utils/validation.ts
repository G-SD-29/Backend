const isValidUrl = (testUrl: string) => {
  try {
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
};

export { isValidUrl };
