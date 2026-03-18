import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Configuracion</h1>
        <p className="text-stone-500">Ajustes del sistema</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* WhatsApp Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <CardTitle>WhatsApp Alertas</CardTitle>
            </div>
            <CardDescription>
              Configura las alertas de inventario por WhatsApp (Meta Business API)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-phone-id">Phone Number ID</Label>
              <Input
                id="whatsapp-phone-id"
                placeholder="Ingresa tu Phone Number ID de Meta"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-token">Access Token</Label>
              <Input
                id="whatsapp-token"
                placeholder="Ingresa tu Access Token"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-recipient">Numero de Notificacion</Label>
              <Input
                id="whatsapp-recipient"
                placeholder="+521234567890"
              />
              <p className="text-xs text-stone-500">
                Numero que recibira las alertas de inventario bajo
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Guardar Configuracion
            </Button>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <CardTitle>Configuracion de Alertas</CardTitle>
            </div>
            <CardDescription>
              Ajusta cuando se envian las alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-cooldown">Tiempo minimo entre alertas (horas)</Label>
              <Input
                id="alert-cooldown"
                type="number"
                defaultValue="4"
                min="1"
                max="24"
              />
              <p className="text-xs text-stone-500">
                Evita spam enviando maximo una alerta por insumo cada X horas
              </p>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              Guardar
            </Button>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Seguridad</CardTitle>
            </div>
            <CardDescription>
              Informacion importante sobre la configuracion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-stone-600">
              Las credenciales de WhatsApp se almacenan de forma segura en las variables de entorno de Vercel.
              Para configurar las variables, ve a la configuracion del proyecto en Vercel y agrega:
            </p>
            <ul className="mt-2 text-sm text-stone-600 list-disc list-inside space-y-1">
              <li><code className="bg-stone-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code></li>
              <li><code className="bg-stone-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code></li>
              <li><code className="bg-stone-100 px-1 rounded">WHATSAPP_RECIPIENT_PHONE</code></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
