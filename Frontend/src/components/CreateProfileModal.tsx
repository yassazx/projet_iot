import { useState } from 'react';
import ModelPreview3D from './ModelPreview3D';
import './CreateProfileModal.css';

interface DroneModel {
    id: number;
    name: string;
    brand: string;
    model_file: string;
    specs: Record<string, string>;
}

interface CreateProfileModalProps {
    models: DroneModel[];
    onClose: () => void;
    onCreate: (modelId: number, name: string, description: string) => void;
}

function CreateProfileModal({ models, onClose, onCreate }: CreateProfileModalProps) {
    const [selectedModel, setSelectedModel] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [step, setStep] = useState<'model' | 'details'>('model');

    const handleSubmit = () => {
        if (selectedModel && name.trim()) {
            onCreate(selectedModel, name.trim(), description.trim());
        }
    };

    const selectedModelData = models.find(m => m.id === selectedModel);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                {step === 'model' ? (
                    <>
                        <h2>Choisir un modèle</h2>
                        <p className="modal-subtitle">Sélectionnez le type de drone que vous souhaitez configurer</p>

                        <div className="models-grid">
                            {models.map(model => {
                                const specs = typeof model.specs === 'string'
                                    ? JSON.parse(model.specs)
                                    : model.specs;

                                return (
                                    <div
                                        key={model.id}
                                        className={`model-card ${selectedModel === model.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedModel(model.id)}
                                    >
                                        <div className="model-preview">
                                            <ModelPreview3D modelFile={model.model_file} size={100} />
                                        </div>
                                        <h3>{model.name}</h3>
                                        <span className="model-brand">{model.brand}</span>
                                        {specs && (
                                            <div className="model-specs">
                                                {specs.weight && <span>{specs.weight}</span>}
                                                {specs.flight_time && <span>{specs.flight_time}</span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={onClose}>
                                Annuler
                            </button>
                            <button
                                className="btn-primary"
                                disabled={!selectedModel}
                                onClick={() => setStep('details')}
                            >
                                Continuer
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>Configurer le drone</h2>
                        <p className="modal-subtitle">
                            Modèle sélectionné : <strong>{selectedModelData?.name}</strong>
                        </p>

                        <div className="form-group">
                            <label htmlFor="drone-name">Nom du drone</label>
                            <input
                                id="drone-name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: Mon Phantom Principal"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="drone-desc">Description (optionnel)</label>
                            <textarea
                                id="drone-desc"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ajoutez des notes sur ce drone..."
                                rows={3}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setStep('model')}>
                                ← Retour
                            </button>
                            <button
                                className="btn-primary"
                                disabled={!name.trim()}
                                onClick={handleSubmit}
                            >
                                Créer le profil
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CreateProfileModal;
