import React from 'react'

function Footer() {
    return (
        <footer className="border-t">
            <div className="mx-auto flex flex-col gap-2 w-full max-w-5xl px-4 py-6 text-sm text-muted-foreground">
                <p>
                    Deterministic job description linter with receipts, no paid AI APIs.

                </p>
                <p >
                    Developed  with <span >❤️</span> by
                    <a href="https://mognia.dev" target="_blank" rel="noopener noreferrer" > Mognia</a>.
                </p>
            </div>
        </footer>    )
}

export default Footer
