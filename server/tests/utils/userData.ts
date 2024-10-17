import { faker } from '@faker-js/faker';

export const generateRandomData = () => ({
  email: faker.internet.email(),
  password: faker.internet.password(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  otp: faker.number.int({ min: 100000, max: 999999 }).toString(),
});

const fixedEmail = 'your.fixed.email@example.com';
const fixedPassword = `myPassword@2000`;
export const FixedData = {
  email: fixedEmail,
  password: fixedPassword,
};
