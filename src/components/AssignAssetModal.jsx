import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'

/**
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - assets: Array<{ codigo, nombre }>
 *  - assigned: Array<string> (códigos pre-asignados)
 *  - onSave: (newAssigned: Array<string>) => void
 */
export default function AssignAssetModal({
    isOpen,
    onClose,
    assets,
    assigned,
    onSave,
}) {
    const [selection, setSelection] = useState(new Set())

    // Inicializa la selección cada vez que abra o cambien los asignados
    useEffect(() => {
        setSelection(new Set(assigned))
    }, [assigned, isOpen])

    const toggle = (code) => {
        const s = new Set(selection)
        s.has(code) ? s.delete(code) : s.add(code)
        setSelection(s)
    }

    const handleSave = () => {
        onSave([...selection])
        onClose()
    }

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog
                onClose={onClose}
                className="fixed inset-0 z-50 flex items-center justify-center"
            >
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
                    <Dialog.Title className="text-lg font-semibold mb-4">
                        Asignar activos
                    </Dialog.Title>

                    <div className="max-h-60 overflow-auto space-y-2">
                        {assets.map((a) => (
                            <label key={a.codigo} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selection.has(a.codigo)}
                                    onChange={() => toggle(a.codigo)}
                                    className="h-4 w-4"
                                />
                                <span>{a.codigo} — {a.nombre}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded border hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
