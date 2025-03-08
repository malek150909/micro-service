export default function Layout({ children }) {
    return (
      <div className="app-layout">
        <header className="app-header">
          
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    );
  }