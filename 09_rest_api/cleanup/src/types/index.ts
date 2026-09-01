export type UserType = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive?: boolean;
};

export type PostType = {
  title: string;
  content: string;
  userId: string;
};
