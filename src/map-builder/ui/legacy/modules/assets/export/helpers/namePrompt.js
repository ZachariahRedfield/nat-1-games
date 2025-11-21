export async function promptForName(promptUser, message, fallback) {
  const input = await promptUser?.(message, fallback);
  return (input ?? fallback) || fallback;
}
