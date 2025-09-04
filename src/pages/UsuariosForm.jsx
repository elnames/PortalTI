// src/pages/UsuariosForm.jsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Shield, CheckCircle } from 'lucide-react';
import StepWizard from '../components/StepWizard';
import LocationSelector from '../components/LocationSelector';
import { useNotificationContext } from '../contexts/NotificationContext';
import api from '../services/api';

const DEPARTAMENTOS = [
  'TI',
  'Recursos Humanos',
  'Finanzas',
  'Ventas',
  'Operaciones',
  'Marketing',
];

export default function UsuariosForm({ edit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [usuarios, setUsuarios] = useState([]);
  const { notifyUserCreated, alertSuccess, alertError } = useNotificationContext();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      rut: '',
      departamento: '',
      empresa: '',
      ubicacion: '',
    },
  });

  // si edit, carga los datos
  useEffect(() => {
    if (edit && id) {
      api
        .get(`/usuarios/${id}`)
        .then(({ data }) => {
          // backend devuelve { id, nombre, apellido, rut, email, departamento }
          reset({
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            rut: data.rut,
            departamento: data.departamento,
            empresa: data.empresa || '',
            ubicacion: data.ubicacion || '',
          });
        })
        .catch(console.error);
    }
  }, [edit, id, reset]);

  useEffect(() => {
    // Carga todos los usuarios para validación local
    api.get('/usuarios').then(({ data }) => setUsuarios(data));
  }, []);

  const datos = watch();

  const onSubmit = async (values) => {
    // Avanza pasos
    if (step < 3) {
      return setStep((s) => s + 1);
    }

    // limpia RUT
    const cleanRut = values.rut.replace(/[.-]/g, '').toUpperCase();
    const cleanEmail = values.email.trim().toLowerCase(); // Limpiar y normalizar email

    const payload = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      email: cleanEmail,
      rut: cleanRut,
      departamento: values.departamento,
      empresa: values.empresa,
      ubicacion: values.ubicacion,
    };

    // Debug logging
    console.log('Payload a enviar:', payload);
    console.log('Email original:', values.email);
    console.log('Email limpio:', cleanEmail);
    console.log('Edit mode:', edit);
    console.log('User ID:', id);

    try {
      let response;
      if (edit) {
        console.log('Enviando PUT a:', `/usuarios/${id}`);
        response = await api.put(`/usuarios/${id}`, payload);
        alertSuccess(`Usuario ${payload.nombre} ${payload.apellido} actualizado correctamente`);
      } else {
        console.log('Enviando POST a:', '/usuarios');
        response = await api.post('/usuarios', payload);
        notifyUserCreated(response.data);
        alertSuccess(`Usuario ${payload.nombre} ${payload.apellido} creado correctamente`);
      }
      navigate('/usuarios');
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      console.error('Error response:', err.response?.data);
      alertError(`Error al ${edit ? 'actualizar' : 'crear'} usuario: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {edit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            {edit ? 'Modifica la información del usuario' : 'Completa la información para registrar un nuevo usuario'}
          </p>
          <button
            onClick={() => navigate('/usuarios')}
            className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>

        {/* Main Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <StepWizard current={step} type="usuario" />

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="space-y-8">
              {/* Paso 1 - Información básica */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Información básica del usuario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          {...register('nombre', { required: 'Nombre es obligatorio' })}
                          className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ingresa el nombre"
                        />
                        {errors.nombre && (
                          <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          {...register('apellido', { required: 'Apellido es obligatorio' })}
                          className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ingresa el apellido"
                        />
                        {errors.apellido && (
                          <p className="text-red-500 text-sm mt-1">{errors.apellido.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          {...register('email', {
                            required: 'Email es obligatorio',
                            pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Email inválido',
                            },
                          })}
                          className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="usuario@empresa.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2 - Detalles específicos */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Detalles específicos del usuario
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          RUT *
                        </label>
                        <input
                          {...register('rut', {
                            required: 'RUT es obligatorio',
                            validate: (v) => {
                              const c = v.replace(/[.-]/g, '');
                              if (!/^[0-9]+[0-9Kk]$/.test(c)) return 'RUT inválido';
                              // Validación de duplicado
                              const existe = usuarios.some(
                                (u) =>
                                  u.rut === c &&
                                  (!edit || String(u.id) !== String(id))
                              );
                              if (existe) return 'Ya existe un usuario con este RUT';
                              return true;
                            },
                          })}
                          placeholder="12345678-9"
                          className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {errors.rut && (
                          <p className="text-red-500 text-sm mt-1">{errors.rut.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Departamento *
                        </label>
                        <Controller
                          name="departamento"
                          control={control}
                          rules={{ required: 'Selecciona un departamento' }}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">-- Selecciona departamento --</option>
                              {DEPARTAMENTOS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        {errors.departamento && (
                          <p className="text-red-500 text-sm mt-1">{errors.departamento.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Empresa *
                        </label>
                        <Controller
                          name="empresa"
                          control={control}
                          rules={{ required: 'Selecciona una empresa' }}
                          render={({ field }) => (
                            <select
                              {...field}
                              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">-- Selecciona empresa --</option>
                              <option value="Empresa A">Empresa A</option>
                              <option value="Empresa B">Empresa B</option>
                              <option value="Empresa C">Empresa C</option>
                              <option value="Empresa D">Empresa D</option>
                            </select>
                          )}
                        />
                        {errors.empresa && (
                          <p className="text-red-500 text-sm mt-1">{errors.empresa.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ubicación *
                        </label>
                        <Controller
                          name="ubicacion"
                          control={control}
                          rules={{ required: 'Selecciona una ubicación' }}
                          render={({ field }) => (
                            <LocationSelector
                              value={field.value}
                              onChange={field.onChange}
                              required={true}
                            />
                          )}
                        />
                        {errors.ubicacion && (
                          <p className="text-red-500 text-sm mt-1">{errors.ubicacion.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3 - Revisión y envío */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                      Revisión y confirmación
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre:</span>
                          <p className="text-gray-900 dark:text-white">{datos.nombre}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Apellido:</span>
                          <p className="text-gray-900 dark:text-white">{datos.apellido}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                          <p className="text-gray-900 dark:text-white">{datos.email}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">RUT:</span>
                          <p className="text-gray-900 dark:text-white">{datos.rut.replace(/[.-]/g, '').toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Departamento:</span>
                          <p className="text-gray-900 dark:text-white">{datos.departamento}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa:</span>
                          <p className="text-gray-900 dark:text-white">{datos.empresa}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación:</span>
                          <p className="text-gray-900 dark:text-white">{datos.ubicacion || 'No especificada'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/usuarios')}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {step > 1 ? 'Anterior' : 'Cancelar'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Guardando...' : step < 3 ? 'Siguiente' : 'Confirmar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}