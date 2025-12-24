'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'default-1',
    name: 'General Outreach',
    subject: 'Quick question about {businessName}',
    body: `Hi {ownerName},\n\nI came across {businessName} while researching {category} businesses in {city}, and I was impressed by what I saw.\n\nI'd love to connect and explore potential partnership opportunities that could benefit your business.\n\nWould you be open to a brief conversation this week?\n\nBest regards,\n[Your Name]\n[Your Company]`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-2',
    name: 'Service Provider',
    subject: 'Helping {businessName} grow',
    body: `Hello {ownerName},\n\nI noticed {businessName} in {city} and wanted to reach out.\n\nWe specialize in helping {category} businesses like yours increase revenue and streamline operations.\n\nMany of our clients in the {category} industry have seen significant growth within the first few months.\n\nWould you be interested in learning more about how we can help {businessName}?\n\nLooking forward to connecting,\n[Your Name]\n[Your Company]`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'default-3',
    name: 'Partnership Proposal',
    subject: 'Partnership opportunity for {businessName}',
    body: `Dear {ownerName},\n\nI'm reaching out because I believe there's a great opportunity for our companies to work together.\n\n{businessName} has an excellent reputation in {city}, and I think our services could complement what you already offer to your customers.\n\nI'd love to schedule a quick call to discuss how we might create value together.\n\nAre you available for a 15-minute call this week?\n\nWarm regards,\n[Your Name]\n[Your Company]`,
    createdAt: new Date().toISOString(),
  },
];

interface TemplateManagerProps {
  onSelectTemplate?: (template: EmailTemplate | null) => void;
  selectedTemplateId?: string | null;
}

export function TemplateManager({ onSelectTemplate, selectedTemplateId }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
  });

  // Load templates from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('emailTemplates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  // Save custom templates (not defaults) to localStorage
  const saveTemplates = (newTemplates: EmailTemplate[]) => {
    const customTemplates = newTemplates.filter(t => !t.id.startsWith('default-'));
    localStorage.setItem('emailTemplates', JSON.stringify(customTemplates));
    setTemplates(newTemplates);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', body: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id.startsWith('default-')) {
      alert('Cannot delete default templates');
      return;
    }
    if (confirm('Are you sure you want to delete this template?')) {
      const updated = templates.filter(t => t.id !== id);
      saveTemplates(updated);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.body) {
      alert('Please fill in all fields');
      return;
    }

    if (editingTemplate) {
      // Update existing
      if (editingTemplate.id.startsWith('default-')) {
        alert('Cannot edit default templates. Please create a new one instead.');
        return;
      }
      const updated = templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData } 
          : t
      );
      saveTemplates(updated);
    } else {
      // Create new
      const newTemplate: EmailTemplate = {
        id: `custom-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      saveTemplates([...templates, newTemplate]);
    }

    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">Create and manage your outreach email templates</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Available variables:</strong> {'{businessName}'}, {'{ownerName}'}, {'{category}'}, {'{city}'}, {'{website}'}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTemplateId === null ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectTemplate?.(null)}
        >
          <CardHeader>
            <CardTitle className="text-base">No Template</CardTitle>
            <CardDescription>Skip outreach email generation</CardDescription>
          </CardHeader>
        </Card>

        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectTemplate?.(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
                </div>
                {!template.id.startsWith('default-') && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(template);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {template.body.substring(0, 150)}...
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Use variables like {'{businessName}'}, {'{ownerName}'}, {'{category}'}, {'{city}'} in your template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Med Spa Outreach"
              />
            </div>
            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Quick question about {businessName}"
              />
            </div>
            <div>
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your email template here..."
                rows={12}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
