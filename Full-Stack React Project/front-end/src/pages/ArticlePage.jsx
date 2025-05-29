import { useParams, useLoaderData, useRevalidator } from 'react-router-dom';
import axios from 'axios';
import CommentsList from '../CommentsList';
import AddCommentForm from '../AddCommentForm';
import articles from '../articles-content';
import useUser from '../useUser';

export default function ArticlePage() {
  const { name } = useParams();
  const { upvotes, comments } = useLoaderData();
  const revalidator = useRevalidator();

  const article = articles.find(a => a.name === name);
  const { user } = useUser();

  async function onUpvoteClicked() {
    const token = user && await user.getIdToken();
    const headers = token ? { authtoken: token } : {};
    await axios.post('/api/articles/' + name + '/upvote', null, { headers });
    revalidator.revalidate(); // refresh loader data
  }

  async function onAddComment({ nameText, commentText }) {
    const token = user && await user.getIdToken();
    const headers = token ? { authtoken: token } : {};
    await axios.post('/api/articles/' + name + '/comments', {
      postedBy: nameText,
      text: commentText,
    }, { headers });
    revalidator.revalidate(); // refresh loader data
  }

  return (
    <>
      <h1>{article.title}</h1>
      {user && <button onClick={onUpvoteClicked}>Upvote</button>}
      <p>This article has {upvotes} upvotes</p>
      {article.content.map(p => <p key={p}>{p}</p>)}
      {user
        ? <AddCommentForm onAddComment={onAddComment} />
        : <p>Log in to add some comments</p>}
      <CommentsList comments={comments} />
    </>
  );
}

export async function loader({ params }) {
  const response = await axios.get('/api/articles/' + params.name);
  const { upvotes, comments } = response.data;
  return { upvotes, comments };
}
