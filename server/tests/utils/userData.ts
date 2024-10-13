import { faker } from '@faker-js/faker';

export const data = {
  email: faker.internet.email(),
  password: faker.internet.password(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
};

const fixedEmail = 'your.fixed.email@example.com';
const fixedPassword = `myPassword@2000`;
export const FixedData = {
  email: fixedEmail,
  password: fixedPassword,
};
