import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Monitor } from "../icons";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  isAgentAllowed,
  isModeAllowedByPolicy,
  isScreenContextAllowed,
} from "../../stores/policyRules";
import { usePolicyStore } from "../../stores/policyStore";
import { useAgentName } from "../../utils/agentName";
import { useDialogs } from "../../hooks/useDialogs";
import { useScreenRecordingPermission } from "../../hooks/useScreenRecordingPermission";
import { Toggle } from "../ui/toggle";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SettingsPanel, SettingsPanelRow, SettingsRow, SectionHeader } from "../ui/SettingsSection";
import PermissionCard from "../ui/PermissionCard";
import PromptStudio from "../ui/PromptStudio";
import InferenceConfigEditor from "./InferenceConfigEditor";

export default function DictationAgentSettings() {
  const { t } = useTranslation();
  const useDictationAgent = useSettingsStore((s) => s.useDictationAgent);
  const setUseDictationAgent = useSettingsStore((s) => s.setUseDictationAgent);
  const voiceAgentScreenContext = useSettingsStore((s) => s.voiceAgentScreenContext);
  const setVoiceAgentScreenContext = useSettingsStore((s) => s.setVoiceAgentScreenContext);
  const useDictationAgentVisionModel = useSettingsStore((s) => s.useDictationAgentVisionModel);
  const setUseDictationAgentVisionModel = useSettingsStore(
    (s) => s.setUseDictationAgentVisionModel
  );
  
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const setTtsEnabled = useSettingsStore((s) => s.setTtsEnabled);
  const ttsWaitTime = useSettingsStore((s) => s.ttsWaitTime);
  const setTtsWaitTime = useSettingsStore((s) => s.setTtsWaitTime);
  const ttsSilenceLevel = useSettingsStore((s) => s.ttsSilenceLevel);
  const setTtsSilenceLevel = useSettingsStore((s) => s.setTtsSilenceLevel);
  const ttsEndpointUrl = useSettingsStore((s) => s.ttsEndpointUrl);
  const setTtsEndpointUrl = useSettingsStore((s) => s.setTtsEndpointUrl);
  const ttsApiKey = useSettingsStore((s) => s.ttsApiKey);
  const setTtsApiKey = useSettingsStore((s) => s.setTtsApiKey);
  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const ttsModel = useSettingsStore((s) => s.ttsModel);
  const setTtsModel = useSettingsStore((s) => s.setTtsModel);
  const {
    isMacOS,
    granted: screenGranted,
    supported: screenSupported,
    needsRelaunch: screenNeedsRelaunch,
    request: requestScreenAccess,
  } = useScreenRecordingPermission();
  const agentAllowed = usePolicyStore(isAgentAllowed);
  const screenContextAllowed = usePolicyStore(isScreenContextAllowed);
  const visionOverrideAllowed = usePolicyStore((state) =>
    isModeAllowedByPolicy(state, "llm", "providers")
  );
  // Display the effective value: an org that forces the feature off shows the
  // toggle off while the raw preference survives for when the policy lifts.
  const screenContextActive = voiceAgentScreenContext && screenContextAllowed;

  const { agentName, setAgentName } = useAgentName();
  const [agentNameInput, setAgentNameInput] = useState(agentName);
  const { showAlertDialog } = useDialogs();

  const handleSaveAgentName = useCallback(() => {
    const trimmed = agentNameInput.trim();

    // setAgentName also moves the name in the dictionary.
    setAgentName(trimmed);
    setAgentNameInput(trimmed);

    showAlertDialog({
      title: t("settingsPage.agentConfig.dialogs.updatedTitle"),
      description: t("settingsPage.agentConfig.dialogs.updatedDescription", {
        name: trimmed,
      }),
    });
  }, [agentNameInput, setAgentName, showAlertDialog, t]);

  const handleScreenContextToggle = useCallback(
    (enabled: boolean) => {
      setVoiceAgentScreenContext(enabled);
      // Keeps the dictation overlay out of its own screenshots.
      window.electronAPI?.setScreenContextEnabled?.(enabled);
      if (enabled && isMacOS && !screenGranted) {
        void requestScreenAccess();
      }
    },
    [setVoiceAgentScreenContext, isMacOS, screenGranted, requestScreenAccess]
  );

  const instructionMode = t("settingsPage.agentConfig.instructionMode");
  const examples = [
    t("settingsPage.agentConfig.examples.formalEmail", { agentName }),
    t("settingsPage.agentConfig.examples.professional", { agentName }),
    t("settingsPage.agentConfig.examples.bulletPoints", { agentName }),
  ];

  const voiceAgentSection = (
    <div className="border-t border-border/70 pt-6 space-y-5">
      <SectionHeader
        title={t("settingsPage.agentConfig.title")}
        description={t("settingsPage.agentConfig.description")}
      />

      <div>
        <p className="text-xs font-medium text-foreground mb-3">
          {t("settingsPage.agentConfig.agentName")}
        </p>
        <SettingsPanel>
          <SettingsPanelRow>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  dir="auto"
                  placeholder={t("settingsPage.agentConfig.placeholder")}
                  value={agentNameInput}
                  onChange={(e) => setAgentNameInput(e.target.value)}
                  className="flex-1 text-center text-base font-mono"
                />
                <Button onClick={handleSaveAgentName} disabled={!agentNameInput.trim()} size="sm">
                  {t("settingsPage.agentConfig.save")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/70">
                {t("settingsPage.agentConfig.helper")}
              </p>
            </div>
          </SettingsPanelRow>
        </SettingsPanel>
      </div>

      <div>
        <SectionHeader title={t("settingsPage.agentConfig.howItWorksTitle")} />
        <SettingsPanel>
          <SettingsPanelRow>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("settingsPage.agentConfig.howItWorksDescription", { agentName })}
            </p>
          </SettingsPanelRow>
        </SettingsPanel>
      </div>

      <div>
        <SectionHeader title={t("settingsPage.agentConfig.examplesTitle")} />
        <SettingsPanel>
          <SettingsPanelRow>
            <div className="space-y-2.5">
              {examples.map((input, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-xs font-medium uppercase tracking-wider px-1.5 py-px rounded bg-primary/10 text-primary dark:bg-primary/15">
                    {instructionMode}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">"{input}"</p>
                </div>
              ))}
            </div>
          </SettingsPanelRow>
        </SettingsPanel>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("dictationAgent.enabled")}
            description={
              agentAllowed
                ? t("dictationAgent.enabledDescription", { agentName })
                : t("common.managedByOrg")
            }
          >
            <Toggle
              checked={useDictationAgent}
              onChange={setUseDictationAgent}
              disabled={!agentAllowed}
            />
          </SettingsRow>
        </SettingsPanelRow>
      </SettingsPanel>

      {useDictationAgent && <InferenceConfigEditor scope="dictationAgent" />}

      {/* Screen context is a voice-agent sub-feature: hidden when an org
          blocks the agent, since enabling it would grant screen-capture
          permission for a route that can never run. */}
      {useDictationAgent && agentAllowed && (
        <div className="border-t border-border/70 pt-6 space-y-3">
          <SectionHeader
            title={t("dictationAgent.screenContext.title")}
            description={t("dictationAgent.screenContext.description")}
          />
          <SettingsPanel>
            <SettingsPanelRow>
              <SettingsRow
                label={t("dictationAgent.screenContext.enable")}
                description={
                  !screenContextAllowed
                    ? t("common.managedByOrg")
                    : screenSupported
                      ? t("dictationAgent.screenContext.enableDescription")
                      : t("dictationAgent.screenContext.unsupported")
                }
              >
                <Toggle
                  checked={screenContextActive}
                  onChange={handleScreenContextToggle}
                  disabled={!screenSupported || !screenContextAllowed}
                />
              </SettingsRow>
            </SettingsPanelRow>
            {screenContextActive && visionOverrideAllowed && (
              <SettingsPanelRow>
                <SettingsRow
                  label={t("dictationAgent.screenContext.visionModel")}
                  description={t("dictationAgent.screenContext.visionModelDescription")}
                >
                  <Toggle
                    checked={useDictationAgentVisionModel}
                    onChange={setUseDictationAgentVisionModel}
                  />
                </SettingsRow>
              </SettingsPanelRow>
            )}
          </SettingsPanel>
          {screenContextActive && isMacOS && !screenGranted && (
            <PermissionCard
              icon={Monitor}
              title={t("dictationAgent.screenContext.permissionTitle")}
              description={t("dictationAgent.screenContext.permissionDescription")}
              granted={false}
              onRequest={requestScreenAccess}
              buttonText={t("onboarding.permissions.grantAccess")}
            />
          )}
          {screenContextActive && isMacOS && screenNeedsRelaunch && (
            <p className="text-[11px] text-warning/80 leading-snug">
              {t("dictationAgent.screenContext.relaunchHint")}
            </p>
          )}
          {screenContextActive && visionOverrideAllowed && useDictationAgentVisionModel && (
            <InferenceConfigEditor scope="dictationAgentVision" allowedModes={["providers"]} />
          )}
        </div>
      )}

      {voiceAgentSection}

      {useDictationAgent && (
        <div className="border-t border-border/70 pt-6">
          <SectionHeader
            title={t("dictationAgent.prompt.title")}
            description={t("dictationAgent.prompt.description")}
          />
          <PromptStudio kind="dictationAgent" />
        </div>
      )}

      {useDictationAgent && (
        <div className="border-t border-border/70 pt-6 space-y-3">
          <SectionHeader
            title="TTS Loop Integration"
            description="Enable seamless spoken responses via text-to-speech."
          />
          <SettingsPanel>
            <SettingsPanelRow>
              <SettingsRow
                label="Enable TTS Loop"
                description="When enabled, the Voice Assistant will read out responses and automatically open the microphone again when it stops speaking."
              >
                <Toggle checked={ttsEnabled} onChange={setTtsEnabled} />
              </SettingsRow>
            </SettingsPanelRow>
            
            {ttsEnabled && (
              <>
                <SettingsPanelRow>
                  <SettingsRow
                    label="Wait Time (seconds)"
                    description="How long the assistant waits in silence before ending the loop and closing the dictation session."
                  >
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={ttsWaitTime}
                      onChange={(e) => setTtsWaitTime(parseInt(e.target.value) || 5)}
                      className="w-24 text-center"
                    />
                  </SettingsRow>
                </SettingsPanelRow>
                <SettingsPanelRow>
                  <SettingsRow
                    label="Silence Level Threshold"
                    description="The audio level below which audio is considered silence."
                  >
                    <Input
                      type="number"
                      min={0.01}
                      max={1.0}
                      step={0.01}
                      value={ttsSilenceLevel}
                      onChange={(e) => setTtsSilenceLevel(parseFloat(e.target.value) || 0.07)}
                      className="w-24 text-center"
                    />
                  </SettingsRow>
                </SettingsPanelRow>
                <SettingsPanelRow>
                  <SettingsRow
                    label="Endpoint URL"
                    description="An OpenAI compatible TTS endpoint (/v1/audio/speech)."
                  >
                    <Input
                      type="text"
                      placeholder="https://api.openai.com/v1/audio/speech"
                      value={ttsEndpointUrl}
                      onChange={(e) => setTtsEndpointUrl(e.target.value)}
                    />
                  </SettingsRow>
                </SettingsPanelRow>
                <SettingsPanelRow>
                  <SettingsRow
                    label="API Key"
                    description="Authentication key for your TTS provider."
                  >
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={ttsApiKey}
                      onChange={(e) => setTtsApiKey(e.target.value)}
                    />
                  </SettingsRow>
                </SettingsPanelRow>
                <SettingsPanelRow>
                  <SettingsRow
                    label="TTS Model"
                    description="The model id (e.g. tts-1 or eleven_multilingual_v2)."
                  >
                    <Input
                      type="text"
                      placeholder="tts-1"
                      value={ttsModel}
                      onChange={(e) => setTtsModel(e.target.value)}
                    />
                  </SettingsRow>
                </SettingsPanelRow>
                <SettingsPanelRow>
                  <SettingsRow
                    label="Voice Name"
                    description="The name of the voice to use (e.g. alloy, echo, etc)."
                  >
                    <Input
                      type="text"
                      placeholder="alloy"
                      value={ttsVoice}
                      onChange={(e) => setTtsVoice(e.target.value)}
                    />
                  </SettingsRow>
                </SettingsPanelRow>
              </>
            )}
          </SettingsPanel>
        </div>
      )}
    </div>
  );
}
