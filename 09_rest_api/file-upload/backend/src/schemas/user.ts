import { z } from 'zod/v4';

// const userSchema = z.strictObject({
//   firstName: z.string().min(1, 'First name is required'),
//   lastName: z.string().min(1, 'Last name is required'),
//   email: z.email('Invalid email.'),
//   image: z
//     .url({
//       protocol: /^https?$/,
//       hostname: z.regexes.domain
//     })
//     .default(
//       'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'
//     )
// });

const coerceString = (val: string | [string]) => {
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
};

const userSchema = z.strictObject({
  firstName: z.preprocess(coerceString, z.string().min(1, 'First name is required')),
  lastName: z.preprocess(coerceString, z.string().min(1, 'First name is required')),
  email: z.preprocess(coerceString, z.email('Invalid emaill')),
  image: z
    .url({
      protocol: /^https?$/,
      hostname: z.regexes.domain
    })
    .default(
      'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg'
    )
});

export { userSchema };
