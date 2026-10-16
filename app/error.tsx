'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main><section className="card content-card"><h1>Something interrupted this view.</h1><p>Your saved local records have not been deleted. Retry to reopen HOPP.</p><button className="primary" onClick={reset}>Try again</button></section></main>}
