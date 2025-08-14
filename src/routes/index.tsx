import { useNavigate } from 'react-router-dom'
import { useEffect, type JSX } from 'react'
import { useFormik } from 'formik'
import { useAuth } from '../lib/contexts/AuthContext'

export default function Home(): JSX.Element {
    const navigate = useNavigate()
    const { setPlayer, isLoading, error, clearError } = useAuth()

    useEffect(() => {
        document.title = 'Loggin - Carrera neuronal 🏎️🧠'
    }, [])

    const formik = useFormik({
        initialValues: { username: '', password: '' },
        validate: values => {
            const errors: Record<string, string> = {}
            if (!values.username || values.username.length < 3) {
                errors['username'] =
                    'El nombre debe tener al menos 3 caracteres'
            }
            if (!/^[0-9]{4}$/.test(values.password)) {
                errors['password'] =
                    'La contraseña debe ser 4 dígitos numéricos'
            }
            return errors
        },
        onSubmit: async ({ username, password }) => {
            try {
                clearError()
                await setPlayer({ username, password })
                navigate('/training/menu')
            } catch (error) {}
        },
        validateOnChange: true,
        validateOnBlur: true,
    })

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '')
        formik.setFieldValue('password', value)
    }

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-background">
            <form
                className="flex flex-col gap-5 w-full max-w-xs bg-white/70 rounded-xl shadow-lg px-6 py-8 border border-accent"
                onSubmit={formik.handleSubmit}
                noValidate
            >
                <h2 className="text-xl font-semibold text-center mb-2 text-primary tracking-tight">
                    Crea/Ingresa tu jugador
                </h2>

                <div className="w-full">
                    <input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Nombre de usuario"
                        className={`w-full px-4 py-2 rounded-md border border-accent bg-background text-primary text-base outline-none focus:ring-2 focus:ring-secondary transition ${formik.errors.username && formik.touched.username ? 'border-red-500' : ''}`}
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        autoComplete="name"
                    />
                    {formik.errors.username && formik.touched.username && (
                        <span className="text-red-500 text-sm mt-1 block">
                            {formik.errors.username}
                        </span>
                    )}
                </div>
                <div className="w-full">
                    <input
                        id="password"
                        name="password"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        minLength={4}
                        placeholder="Contraseña de 4-dígitos"
                        className={`w-full px-4 py-2 rounded-md border border-accent bg-background text-primary text-base outline-none focus:ring-2 focus:ring-secondary transition ${formik.errors.password && formik.touched.password ? 'border-red-500' : ''}`}
                        value={formik.values.password}
                        onChange={handlePasswordChange}
                        onBlur={formik.handleBlur}
                        autoComplete="current-password"
                    />
                    {formik.errors.password && formik.touched.password && (
                        <span className="text-red-500 text-sm mt-1 block">
                            {formik.errors.password}
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    className="w-full mt-2 rounded-md px-4 py-2 font-medium bg-primary text-white hover:bg-secondary hover:text-background transition-colors focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={
                        isLoading || !formik.isValid || formik.isSubmitting
                    }
                >
                    {isLoading || formik.isSubmitting
                        ? 'Cargando...'
                        : 'Empezar'}
                </button>
                {/* Error Message */}
                {error && (
                    <div className="w-full p-3 bg-error/20 border border-error rounded-md">
                        <p className="text-error text-sm text-center font-medium">
                            {error}
                        </p>
                    </div>
                )}
            </form>
        </div>
    )
}
