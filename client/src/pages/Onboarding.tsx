import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Home, Users, MapPin, ChevronRight, ChevronLeft } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Dati obbligatori
    membershipType: "" as "resident" | "domiciled" | "landowner" | "",
    street: "",
    streetNumber: "",
    zipCode: "00030",
    municipality: "" as "san_cesareo" | "zagarolo" | "",
    
    // Step 2 - Nucleo familiare (opzionale)
    householdSize: 1,
    hasMinors: false,
    minorsCount: 0,
    hasSeniors: false,
    seniorsCount: 0,
  });

  const completeMutation = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Onboarding completato! Il tuo account è in attesa di verifica.");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error("Errore durante l'onboarding: " + error.message);
    },
  });

  const handleNext = () => {
    // Validazione Step 1
    if (step === 1) {
      if (!formData.membershipType || !formData.street || !formData.streetNumber || !formData.municipality) {
        toast.error("Compila tutti i campi obbligatori");
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = () => {
    completeMutation.mutate({
      membershipType: formData.membershipType as "resident" | "domiciled" | "landowner",
      street: formData.street,
      streetNumber: formData.streetNumber,
      zipCode: formData.zipCode,
      municipality: formData.municipality as "san_cesareo" | "zagarolo",
      householdSize: formData.householdSize > 0 ? formData.householdSize : undefined,
      hasMinors: formData.hasMinors,
      minorsCount: formData.hasMinors ? formData.minorsCount : undefined,
      hasSeniors: formData.hasSeniors,
      seniorsCount: formData.hasSeniors ? formData.seniorsCount : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <Home className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
            Benvenuto a Prato Rinaldo
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Completa il tuo profilo per accedere alla piattaforma
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className={`w-12 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-teal-600' : 'bg-gray-200'}`} />
            <div className={`w-12 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} di 2
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-teal-900">Informazioni sulla Residenza</h3>
                    <p className="text-sm text-teal-700 mt-1">
                      Questi dati sono necessari per verificare la tua appartenenza al consorzio di Prato Rinaldo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="membershipType">Tipo di Appartenenza *</Label>
                <Select
                  value={formData.membershipType}
                  onValueChange={(value) => setFormData({ ...formData, membershipType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il tipo di appartenenza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resident">Residente</SelectItem>
                    <SelectItem value="domiciled">Domiciliato</SelectItem>
                    <SelectItem value="landowner">Proprietario Terreno</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Scegli se sei residente, domiciliato o solo proprietario di un terreno
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">Via *</Label>
                  <Input
                    id="street"
                    placeholder="es. Via Roma"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="streetNumber">Civico *</Label>
                  <Input
                    id="streetNumber"
                    placeholder="es. 12"
                    value={formData.streetNumber}
                    onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="municipality">Comune *</Label>
                  <Select
                    value={formData.municipality}
                    onValueChange={(value) => setFormData({ ...formData, municipality: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona il comune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="san_cesareo">San Cesareo</SelectItem>
                      <SelectItem value="zagarolo">Zagarolo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CAP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Continua
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Informazioni sul Nucleo Familiare</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Questi dati sono opzionali e ci aiutano a organizzare meglio eventi e servizi per la comunità.
                    </p>
                  </div>
                </div>
              </div>

              {(formData.membershipType === "resident" || formData.membershipType === "domiciled") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="householdSize">Numero di componenti del nucleo familiare</Label>
                    <Input
                      id="householdSize"
                      type="number"
                      min="1"
                      value={formData.householdSize}
                      onChange={(e) => setFormData({ ...formData, householdSize: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasMinors"
                        checked={formData.hasMinors}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasMinors: checked as boolean, minorsCount: checked ? formData.minorsCount : 0 })}
                      />
                      <Label htmlFor="hasMinors" className="cursor-pointer">
                        Ci sono minori nel nucleo familiare
                      </Label>
                    </div>

                    {formData.hasMinors && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="minorsCount">Numero di minori</Label>
                        <Input
                          id="minorsCount"
                          type="number"
                          min="0"
                          value={formData.minorsCount}
                          onChange={(e) => setFormData({ ...formData, minorsCount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasSeniors"
                        checked={formData.hasSeniors}
                        onCheckedChange={(checked) => setFormData({ ...formData, hasSeniors: checked as boolean, seniorsCount: checked ? formData.seniorsCount : 0 })}
                      />
                      <Label htmlFor="hasSeniors" className="cursor-pointer">
                        Ci sono anziani (over 65) nel nucleo familiare
                      </Label>
                    </div>

                    {formData.hasSeniors && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="seniorsCount">Numero di anziani</Label>
                        <Input
                          id="seniorsCount"
                          type="number"
                          min="0"
                          value={formData.seniorsCount}
                          onChange={(e) => setFormData({ ...formData, seniorsCount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {formData.membershipType === "landowner" && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Come proprietario di terreno, non è necessario fornire informazioni sul nucleo familiare.</p>
                  <p className="mt-2">Puoi procedere con il completamento dell'onboarding.</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1" 
                  size="lg"
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? "Salvataggio..." : "Completa Onboarding"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

