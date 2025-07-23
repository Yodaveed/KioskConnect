import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Image, X } from "lucide-react";

interface LogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
  onLogoRemove: () => void;
}

export default function LogoUpload({ currentLogo, onLogoChange, onLogoRemove }: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState(currentLogo || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (logoUrl.trim()) {
      onLogoChange(logoUrl.trim());
      setIsEditing(false);
    }
  };

  const handleRemove = () => {
    setLogoUrl("");
    onLogoRemove();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLogoUrl(currentLogo || "");
    setIsEditing(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logo Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLogo && !isEditing ? (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-3">
              <img 
                src={currentLogo} 
                alt="Current logo" 
                className="w-12 h-12 object-contain bg-white rounded border"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'/%3E%3Ccircle cx='12' cy='13' r='3'/%3E%3C/svg%3E";
                }}
              />
              <div>
                <p className="font-medium">Logo Active</p>
                <p className="text-sm text-gray-600">Will appear in top-left corner</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Change
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="logoUrl">Logo Image URL</Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://example.com/your-logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter the URL of your logo image. Recommended: PNG/JPG, max 200x80px
              </p>
            </div>
            
            {logoUrl && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img 
                  src={logoUrl} 
                  alt="Logo preview" 
                  className="max-w-48 max-h-20 object-contain bg-white rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                  }}
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!logoUrl.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                {currentLogo ? "Update Logo" : "Set Logo"}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
        
        {!currentLogo && !isEditing && (
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 mb-3">No logo set</p>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Logo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}