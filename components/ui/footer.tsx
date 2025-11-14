export default function Footer() {
    return (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-6">
                <div className="text-center text-sm text-muted-foreground">
                    <p>
                        برای ارتباط با سازنده:{' '}
                        <a
                            href="mailto:raminramazanpour@gmail.com"
                            className="text-primary hover:underline"
                        >
                            raminramazanpour@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}

