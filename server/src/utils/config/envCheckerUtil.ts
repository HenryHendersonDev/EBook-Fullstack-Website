import colors from 'colors';

// Checking provided Array each ENV are available or not. if Not Throwing Un Handled Error to Stop Using Application. technically This is only for Host,Port,HTTP
const ErrorEnv = (array: string[]) => {
  array.forEach((key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        colors.red(`Error: Environment variable '${key}' is not set.`),
      );
    }
  });
};

// Checking provided Array each ENV are available or not. if Not Showing on Console.
const WarnEnv = (array: string[]) => {
  array.forEach((key) => {
    const value = process.env[key];
    if (!value) {
      console.warn(
        colors.yellow(`Warning: Environment variable ${key} is not set.`),
      );
    }
  });
};

export { ErrorEnv, WarnEnv };
