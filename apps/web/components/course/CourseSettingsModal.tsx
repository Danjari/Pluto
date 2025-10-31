"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Mail, Clock, CheckCircle, Loader2 } from "lucide-react";

interface CourseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

interface NotificationSettings {
  id?: string;
  emailNotificationsEnabled: boolean;
  studyDays: string[];
  notificationTime: string;
}

const DAYS_OF_WEEK = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
  { key: "SAT", label: "Saturday" },
  { key: "SUN", label: "Sunday" },
];

export default function CourseSettingsModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
}: CourseSettingsModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotificationsEnabled: true,
    studyDays: ["MON", "WED", "FRI"],
    notificationTime: "21:00",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, courseId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/settings/notifications`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/settings/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to save settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setTestingEmail(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/settings/test-email`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Test email sent! Check your inbox." });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to send test email" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send test email" });
    } finally {
      setTestingEmail(false);
    }
  };

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(day)
        ? prev.studyDays.filter(d => d !== day)
        : [...prev.studyDays, day]
    }));
  };

  const handleTimeChange = (time: string) => {
    setSettings(prev => ({ ...prev, notificationTime: time }));
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Course Settings
          </DialogTitle>
          <DialogDescription>
            Configure email notifications for <strong>{courseTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Notifications Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription>
                    Receive motivational reminders to keep studying
                  </CardDescription>
                </div>
                <Switch
                  checked={settings.emailNotificationsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, emailNotificationsEnabled: checked }))
                  }
                />
              </div>
            </CardHeader>
          </Card>

          {/* Study Days Selection */}
          {settings.emailNotificationsEnabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Study Days</CardTitle>
                <CardDescription>
                  Choose which days you want to receive reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label
                      key={day.key}
                      className={`flex items-center space-x-1.5 cursor-pointer px-3 py-1.5 rounded-md border transition-all ${
                        settings.studyDays.includes(day.key)
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={settings.studyDays.includes(day.key)}
                        onChange={() => toggleDay(day.key)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs font-medium whitespace-nowrap">{day.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Time */}
          {settings.emailNotificationsEnabled && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Notification Time
                </CardTitle>
                <CardDescription>
                  When to send reminder emails (in your timezone)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={settings.notificationTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Email Button */}
          {settings.emailNotificationsEnabled && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={sendTestEmail}
                  disabled={testingEmail}
                  variant="outline"
                  className="w-full"
                >
                  {testingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Test Email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Test Email Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Preview how your reminder emails will look
                </p>
              </CardContent>
            </Card>
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
