import { db } from '#db';

const posts = db('project_a').collection('posts');

const result = await posts.insertOne({ test: 'hello' });
console.log(result);
