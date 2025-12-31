import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="nav-logo">
                        <span className="logo-icon">🚁</span>
                        <span className="logo-text">DroneIOT</span>
                    </div>

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                        <a href="#features">Fonctionnalités</a>
                        <a href="#about">À propos</a>
                        <a href="#contact">Contact</a>
                        <Link to="/login" className="nav-btn login-btn">Connexion</Link>
                        <Link to="/register" className="nav-btn register-btn">S'inscrire</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-bg-animation"></div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-icon">✨</span>
                        <span>Système de Télémétrie Avancé</span>
                    </div>
                    <h1 className="hero-title">
                        Surveillez vos <span className="gradient-text">Drones</span> en temps réel
                    </h1>
                    <p className="hero-description">
                        Solution IoT complète pour la surveillance, le contrôle et l'analyse
                        de données de vos drones. Visualisation 3D, alertes intelligentes et
                        prédictions IA.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/register" className="btn btn-primary">
                            <span>Commencer Gratuitement</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </Link>
                        <Link to="/login" className="btn btn-secondary">
                            J'ai déjà un compte
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-value">99.9%</span>
                            <span className="stat-label">Uptime</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-value">&lt; 50ms</span>
                            <span className="stat-label">Latence</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat">
                            <span className="stat-value">24/7</span>
                            <span className="stat-label">Monitoring</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="drone-card">
                        <div className="card-glow"></div>
                        <div className="drone-emoji">🚁</div>
                        <div className="telemetry-data">
                            <div className="data-row">
                                <span className="data-label">Pitch</span>
                                <span className="data-value">12.5°</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Roll</span>
                                <span className="data-value">-3.2°</span>
                            </div>
                            <div className="data-row">
                                <span className="data-label">Yaw</span>
                                <span className="data-value">180°</span>
                            </div>
                        </div>
                        <div className="status-indicator">
                            <span className="status-dot"></span>
                            <span>En ligne</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <span className="section-badge">Fonctionnalités</span>
                    <h2>Tout ce dont vous avez besoin</h2>
                    <p>Une plateforme complète pour gérer votre flotte de drones</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📡</div>
                        <h3>Télémétrie Temps Réel</h3>
                        <p>Recevez les données de vos capteurs MPU6050 instantanément via WebSocket.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎮</div>
                        <h3>Visualisation 3D</h3>
                        <p>Visualisez l'orientation de votre drone en temps réel avec un modèle 3D interactif.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>Prédictions IA</h3>
                        <p>Anticipez les risques de renversement grâce à notre modèle de Machine Learning.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔔</div>
                        <h3>Alertes Intelligentes</h3>
                        <p>Recevez des alertes en temps réel lorsque des situations critiques sont détectées.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Dashboard Complet</h3>
                        <p>Tableau de bord intuitif avec toutes les métriques importantes à portée de main.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Sécurisé</h3>
                        <p>Authentification JWT et connexions sécurisées pour protéger vos données.</p>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="about-content">
                    <span className="section-badge">À propos</span>
                    <h2>Projet IoT - Système de Télémétrie Drone</h2>
                    <p>
                        Ce projet combine les technologies IoT modernes avec le Machine Learning
                        pour créer une solution complète de surveillance de drones. Utilisant un
                        capteur gyroscopique MPU6050 connecté à un Raspberry Pi, les données sont
                        transmises en temps réel vers notre plateforme cloud.
                    </p>
                    <div className="tech-stack">
                        <span className="tech-badge">React</span>
                        <span className="tech-badge">Three.js</span>
                        <span className="tech-badge">Node.js</span>
                        <span className="tech-badge">PostgreSQL</span>
                        <span className="tech-badge">Python ML</span>
                        <span className="tech-badge">WebSocket</span>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Prêt à décoller ?</h2>
                    <p>Créez votre compte gratuitement et commencez à surveiller vos drones.</p>
                    <Link to="/register" className="btn btn-primary btn-large">
                        Créer mon compte
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <span className="logo-icon">🚁</span>
                        <span className="logo-text">DroneIOT</span>
                    </div>
                    <p>Projet IoT - Système de Télémétrie Drone avec MPU6050</p>
                    <p className="copyright">© 2024 DroneIOT. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
