import { Link } from "react-router-dom"

export default function ArticlesList({ articles }) {
    return (
        <>
            {articles.map(a => (
                <Link key={a.name} to={'/articles/' + a.name}>
                    <h3>{a.title}</h3>
                    <p>{a.content[0].substring(0, 150)}</p>
                </Link>

            ))}
        </>

    );
}