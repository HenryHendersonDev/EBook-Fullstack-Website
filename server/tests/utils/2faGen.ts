import speakeasy from 'speakeasy';

const generateToken = (secret: string): string => {
  const token = speakeasy.totp({
    secret,
    encoding: 'base32',
  });

  return token;
};

export default generateToken;
