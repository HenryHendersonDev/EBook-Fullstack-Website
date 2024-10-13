import otpGenerator from 'otp-generator';

const gen6DNumber = (): string => {
  const otp = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};

export default gen6DNumber;
