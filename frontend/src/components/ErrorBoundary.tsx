import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Contenu affiché à la place de l'arbre planté. Optionnel. */
    fallback?: ReactNode;
    /** Nom de la zone protégée, affiché dans la console pour le diagnostic. */
    label?: string;
}

interface State {
    error: Error | null;
}

/**
 * Empêche qu'une exception dans un sous-composant efface toute l'interface.
 * Sans ce garde-fou, la moindre erreur de rendu (carte, date invalide, champ
 * manquant) démonte l'arbre React entier et l'utilisateur voit une page
 * blanche, sans aucun message.
 *
 * Usage : envelopper les zones à risque (carte, widgets tiers) et, en
 * dernier recours, l'application entière.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Journalisation : à brancher sur Sentry / un endpoint de logs si besoin.
        console.error(`[ErrorBoundary${this.props.label ? ` – ${this.props.label}` : ''}]`, error, info);
    }

    handleReset = () => this.setState({ error: null });

    render() {
        if (!this.state.error) return this.props.children;
        if (this.props.fallback !== undefined) return this.props.fallback;

        return (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm font-semibold text-amber-800">
                    Cette section n'a pas pu s'afficher.
                </p>
                <p className="max-w-md text-xs text-amber-700/80">
                    Le reste de la page reste consultable. Si le problème persiste,
                    contactez le support en précisant votre numéro de suivi.
                </p>
                <button
                    type="button"
                    onClick={this.handleReset}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                    Réessayer
                </button>
            </div>
        );
    }
}