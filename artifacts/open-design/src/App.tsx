import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { BonanzaLanding } from './components/BonanzaLanding';
import { BonanzaNotFound } from './components/BonanzaNotFound';
import type { CreateInput } from './components/NewProjectPanel';
import {
  daemonIsLive,
  fetchAppVersionInfo,
  fetchAgents,
  fetchDesignSystems,
  fetchPromptTemplates,
  fetchSkills,
} from './providers/registry';
import { navigate, useRoute } from './router';
import {
  hasAnyConfiguredProvider,
  loadConfig,
  saveConfig,
  syncMediaProvidersToDaemon,
} from './state/config';
import {
  createProject,
  deleteProject as deleteProjectApi,
  importClaudeDesignZip,
  listProjects,
  listTemplates,
  patchProject,
} from './state/projects';
import type {
  AgentInfo,
  AppConfig,
  AppVersionInfo,
  DesignSystemSummary,
  Project,
  ProjectTemplate,
  PromptTemplateSummary,
  SkillSummary,
} from './types';

// Lazy-loaded surfaces. The public landing (BonanzaLanding) is the
// only route that ships eagerly — everything operator-facing
// (studio, entry view, project IDE, settings dialog) loads on
// demand so the public bundle stays small. Suspense fallback uses
// the brand identity (italic Cormorant, soft ink, no spinner).
const BonanzaStudio = lazy(() =>
  import('./components/BonanzaStudio').then((m) => ({ default: m.BonanzaStudio })),
);
const EntryView = lazy(() =>
  import('./components/EntryView').then((m) => ({ default: m.EntryView })),
);
const ProjectView = lazy(() =>
  import('./components/ProjectView').then((m) => ({ default: m.ProjectView })),
);
const SettingsDialog = lazy(() =>
  import('./components/SettingsDialog').then((m) => ({ default: m.SettingsDialog })),
);

function StudioLoading() {
  // Studio surface is intentionally deferred from Stage 2 restyle.
  // Original cream/Cormorant treatment preserved verbatim so the
  // operator-facing surface remains internally consistent until a
  // dedicated studio restyle pass.
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'oklch(96% 0.012 90)',
        color: 'oklch(35% 0 0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
        fontFamily:
          "'Cormorant Garamond', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
      }}
    >
      <span
        style={{
          display: 'block',
          width: 32,
          height: 1,
          background: 'oklch(62% 0.13 70)',
        }}
        aria-hidden="true"
      />
      <p
        style={{
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: '1.5rem',
          margin: 0,
          color: 'oklch(35% 0 0)',
        }}
      >
        Loading…
      </p>
    </div>
  );
}

export function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsWelcome, setSettingsWelcome] = useState(false);
  const [daemonLive, setDaemonLive] = useState(false);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [designSystems, setDesignSystems] = useState<DesignSystemSummary[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplateSummary[]>([]);
  const [appVersionInfo, setAppVersionInfo] = useState<AppVersionInfo | null>(null);
  // Goes false once the bootstrap effect has finished its initial round of
  // fetches. The entry view uses this to show shimmer / skeleton states
  // instead of an "empty" page that flickers before data lands.
  const [bootstrapping, setBootstrapping] = useState(true);
  const route = useRoute();

  // Sync theme preference to the <html> element so CSS variables pick it up.
  // useLayoutEffect (vs useEffect) fires before the browser paints, so a
  // live theme switch in Settings applies atomically — no 1-frame flash of
  // the old theme. Safe here because the component tree is ssr:false.
  useLayoutEffect(() => {
    const theme = config.theme ?? 'system';
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [config.theme]);

  // /studio (route.kind === 'home') is gated behind an internal flag so
  // the brand front door stays the only public surface. Computed up here
  // so the bootstrap effect can short-circuit and the studio chrome
  // (EntryView, SettingsDialog, daemon polling) never initialises for
  // public visitors.
  const studioUnlocked =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('bonanza_internal') === 'true';
  const homeBlocked = route.kind === 'home' && !studioUnlocked;

  // Bootstrap — detect daemon, load pickers, seed sensible defaults.
  useEffect(() => {
    // Public landing makes ZERO operator-side fetches. The brand
    // front door must not poll the daemon, hit the registry, or
    // surface any IDE chrome. This keeps the public bundle's
    // network tab empty and the experience instant.
    if (route.kind === 'landing') {
      setBootstrapping(false);
      return;
    }
    if (homeBlocked) {
      setBootstrapping(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const alive = await daemonIsLive();
      if (cancelled) return;
      setDaemonLive(alive);
      const [agentList, skillList, dsList, projectList, templateList, promptTemplateList, versionInfo] =
        await Promise.all([
          alive ? fetchAgents() : Promise.resolve([] as AgentInfo[]),
          alive ? fetchSkills() : Promise.resolve([] as SkillSummary[]),
          alive
            ? fetchDesignSystems()
            : Promise.resolve([] as DesignSystemSummary[]),
          alive ? listProjects() : Promise.resolve([] as Project[]),
          alive ? listTemplates() : Promise.resolve([] as ProjectTemplate[]),
          alive ? fetchPromptTemplates() : Promise.resolve([] as PromptTemplateSummary[]),
          alive ? fetchAppVersionInfo() : Promise.resolve(null),
        ]);
      if (cancelled) return;
      setAgents(agentList);
      setSkills(skillList);
      setDesignSystems(dsList);
      setProjects(projectList);
      setTemplates(templateList);
      setPromptTemplates(promptTemplateList);
      setAppVersionInfo(versionInfo);

      setConfig((prev) => {
        const next = { ...prev };
        if (alive) {
          if (!next.agentId) {
            const firstAvailable = agentList.find((a) => a.available);
            if (firstAvailable) next.agentId = firstAvailable.id;
          }
          if (!next.designSystemId && dsList.length > 0) {
            next.designSystemId = dsList.find((d) => d.id === 'default')?.id
              ?? dsList[0]!.id;
          }
        } else {
          next.mode = 'api';
        }
        saveConfig(next);
        if (alive && hasAnyConfiguredProvider(next.mediaProviders)) {
          void syncMediaProvidersToDaemon(next.mediaProviders);
        }

        // Pop the onboarding modal only on the first run, and only once the
        // user has actually entered the Studio. The Bonanza landing is the
        // brand front door — surfacing a config dialog on top of it would
        // break the "quiet authority" feel the landing is built for.
        if (!next.onboardingCompleted && route.kind !== 'landing') {
          setSettingsWelcome(true);
          setSettingsOpen(true);
        }
        return next;
      });
      setBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [homeBlocked, route.kind]);

  const refreshProjects = useCallback(async () => {
    const list = await listProjects();
    setProjects(list);
  }, []);

  const refreshTemplates = useCallback(async () => {
    const list = await listTemplates();
    setTemplates(list);
  }, []);

  const handleConfigSave = useCallback((next: AppConfig) => {
    // Saving from any settings dialog (welcome or regular) counts as
    // having completed onboarding — the user has actively chosen a
    // configuration, so future page loads can skip the auto-popup.
    const withOnboarding: AppConfig = { ...next, onboardingCompleted: true };
    saveConfig(withOnboarding);
    void syncMediaProvidersToDaemon(withOnboarding.mediaProviders, { force: true });
    setConfig(withOnboarding);
    setSettingsOpen(false);
  }, []);

  const handleModeChange = useCallback(
    (mode: AppConfig['mode']) => {
      const next = { ...config, mode };
      saveConfig(next);
      setConfig(next);
    },
    [config],
  );

  const handleAgentChange = useCallback(
    (agentId: string) => {
      const next = { ...config, agentId };
      saveConfig(next);
      setConfig(next);
    },
    [config],
  );

  const handleAgentModelChange = useCallback(
    (agentId: string, choice: { model?: string; reasoning?: string }) => {
      const prev = config.agentModels?.[agentId] ?? {};
      const merged = { ...prev, ...choice };
      const nextAgentModels = { ...(config.agentModels ?? {}), [agentId]: merged };
      const next = { ...config, agentModels: nextAgentModels };
      saveConfig(next);
      setConfig(next);
    },
    [config],
  );

  const handleChangeDefaultDesignSystem = useCallback(
    (designSystemId: string) => {
      const next = { ...config, designSystemId };
      saveConfig(next);
      setConfig(next);
    },
    [config],
  );

  const refreshAgents = useCallback(async () => {
    const next = await fetchAgents();
    setAgents(next);
  }, []);

  const handleCreateProject = useCallback(
    async (input: CreateInput & { pendingPrompt?: string }) => {
      // Honor an explicit `null` design system — the create panel defaults
      // to "None" for every kind now, and the user expects that to land
      // as a no-design-system project rather than silently inheriting the
      // workspace default.
      const result = await createProject({
        name: input.name,
        skillId: input.skillId,
        designSystemId: input.designSystemId,
        pendingPrompt: input.pendingPrompt,
        metadata: input.metadata,
      });
      if (!result) return;
      setProjects((curr) => [result.project, ...curr.filter((p) => p.id !== result.project.id)]);
      navigate({ kind: 'project', projectId: result.project.id, fileName: null });
    },
    [],
  );

  const handleImportClaudeDesign = useCallback(async (file: File) => {
    const result = await importClaudeDesignZip(file);
    if (!result) return;
    setProjects((curr) => [result.project, ...curr.filter((p) => p.id !== result.project.id)]);
    navigate({
      kind: 'project',
      projectId: result.project.id,
      fileName: result.entryFile,
    });
  }, []);

  const handleOpenProject = useCallback((id: string) => {
    navigate({ kind: 'project', projectId: id, fileName: null });
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    const ok = await deleteProjectApi(id);
    if (!ok) return;
    setProjects((curr) => curr.filter((p) => p.id !== id));
    if (route.kind === 'project' && route.projectId === id) {
      navigate({ kind: 'home' });
    }
  }, [route]);

  const handleBack = useCallback(() => {
    navigate({ kind: 'home' });
  }, []);

  const handleClearPendingPrompt = useCallback(() => {
    const projectId =
      route.kind === 'project' ? route.projectId : null;
    if (!projectId) return;
    setProjects((curr) =>
      curr.map((p) =>
        p.id === projectId ? { ...p, pendingPrompt: undefined } : p,
      ),
    );
    void patchProject(projectId, { pendingPrompt: undefined });
  }, [route]);

  const handleTouchProject = useCallback(() => {
    const projectId =
      route.kind === 'project' ? route.projectId : null;
    if (!projectId) return;
    const updatedAt = Date.now();
    setProjects((curr) =>
      curr.map((p) => (p.id === projectId ? { ...p, updatedAt } : p)),
    );
    void patchProject(projectId, { updatedAt });
  }, [route]);

  const handleProjectChange = useCallback((updated: Project) => {
    setProjects((curr) =>
      curr.map((p) => (p.id === updated.id ? updated : p)),
    );
  }, []);

  const activeProject =
    route.kind === 'project'
      ? projects.find((p) => p.id === route.projectId) ?? null
      : null;

  // Deep-linked route to a project we don't have yet (e.g. after a refresh
  // that finishes after the project list comes back). Fetch it in the
  // background so the view can render rather than bouncing to home.
  useEffect(() => {
    if (route.kind !== 'project') return;
    if (activeProject) return;
    if (!projects.length && !daemonLive) return;
    if (projects.some((p) => p.id === route.projectId)) return;
    let cancelled = false;
    (async () => {
      const list = await listProjects();
      if (cancelled) return;
      setProjects(list);
      if (!list.find((p) => p.id === route.projectId)) {
        navigate({ kind: 'home' }, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route, activeProject, projects, daemonLive]);

  const openSettings = useCallback(() => {
    setSettingsWelcome(false);
    setSettingsOpen(true);
  }, []);

  // When the user lands on the entry view (route.kind === 'home'), pull
  // a fresh template list. The template store is global — if they just
  // saved a template inside a project, returning home should reflect it
  // immediately in the From-template tab without forcing a page reload.
  useEffect(() => {
    if (route.kind !== 'home') return;
    void refreshTemplates();
  }, [route.kind, refreshTemplates]);

  // Short-circuit BEFORE any Open Design tree mounts. Returning here
  // means SettingsDialog, EntryView, and AppChromeHeader are never
  // even instantiated for public /studio visitors — the brief is
  // explicit on this. Set localStorage.bonanza_internal = 'true' to
  // unlock.
  if (homeBlocked) {
    return <BonanzaNotFound />;
  }

  // Landing is the eagerly-loaded public surface. Returning before
  // any Suspense boundary keeps the landing free of fallback flicker
  // and proves at the type level that the public path never touches
  // any lazy chunk.
  if (route.kind === 'landing') {
    return <BonanzaLanding />;
  }

  // /studio (route.kind === 'home') belongs to Bonanza Studio for
  // internal users. Open Design's project IDE still lives at
  // /projects/:id — only the entry view is replaced.
  if (route.kind === 'home' && !activeProject) {
    return (
      <Suspense fallback={<StudioLoading />}>
        <BonanzaStudio />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<StudioLoading />}>
      {activeProject ? (
        <ProjectView
          key={activeProject.id}
          project={activeProject}
          routeFileName={route.kind === 'project' ? route.fileName : null}
          config={config}
          agents={agents}
          skills={skills}
          designSystems={designSystems}
          daemonLive={daemonLive}
          onModeChange={handleModeChange}
          onAgentChange={handleAgentChange}
          onAgentModelChange={handleAgentModelChange}
          onRefreshAgents={refreshAgents}
          onOpenSettings={openSettings}
          onBack={handleBack}
          onClearPendingPrompt={handleClearPendingPrompt}
          onTouchProject={handleTouchProject}
          onProjectChange={handleProjectChange}
          onProjectsRefresh={refreshProjects}
        />
      ) : (
        <EntryView
          skills={skills}
          designSystems={designSystems}
          projects={projects}
          templates={templates}
          promptTemplates={promptTemplates}
          defaultDesignSystemId={config.designSystemId}
          config={config}
          agents={agents}
          loading={bootstrapping}
          onCreateProject={handleCreateProject}
          onImportClaudeDesign={handleImportClaudeDesign}
          onOpenProject={handleOpenProject}
          onDeleteProject={handleDeleteProject}
          onChangeDefaultDesignSystem={handleChangeDefaultDesignSystem}
          onOpenSettings={openSettings}
        />
      )}
      {settingsOpen ? (
        <SettingsDialog
          initial={config}
          agents={agents}
          daemonLive={daemonLive}
          appVersionInfo={appVersionInfo}
          welcome={settingsWelcome}
          onSave={handleConfigSave}
          onClose={() => {
            // Dismissing the welcome modal (Skip for now / backdrop click)
            // also counts as onboarding-done; we don't want to keep
            // re-prompting on every refresh just because the user opted
            // not to save.
            if (settingsWelcome && !config.onboardingCompleted) {
              const next: AppConfig = { ...config, onboardingCompleted: true };
              saveConfig(next);
              setConfig(next);
            }
            setSettingsOpen(false);
          }}
          onRefreshAgents={refreshAgents}
        />
      ) : null}
    </Suspense>
  );
}
