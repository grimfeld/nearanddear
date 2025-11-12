import { expect, test, type Page, type Route } from '@playwright/test';

type MapInsertPayload = {
  owner_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  cover_url: string | null;
};

type MapRecord = MapInsertPayload & {
  id: string;
  created_at: string;
  updated_at: string;
};

const SUPABASE_STORAGE_KEY = 'nearanddear-auth';

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

const fakeUser = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'owner@example.com',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    name: 'Owner Tester',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const fakeProfile = {
  id: fakeUser.id,
  email: fakeUser.email,
  display_name: 'Owner Tester',
  avatar_url: null,
  bio: null,
  favorite_tags: [] as string[],
  city: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const fakeSessionExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
const fakeSession = {
  access_token: 'test-access-token',
  token_type: 'bearer',
  expires_in: 60 * 60,
  expires_at: fakeSessionExpiresAt,
  refresh_token: 'test-refresh-token',
  user: fakeUser,
};

const mapScenarios = [
  {
    name: 'title only (private)',
    description: '',
    coverUrl: '',
    isPublic: false,
  },
  {
    name: 'title and description (private)',
    description: 'A short description for the map.',
    coverUrl: '',
    isPublic: false,
  },
  {
    name: 'title and cover image (private)',
    description: '',
    coverUrl: 'https://example.com/cover-private.png',
    isPublic: false,
  },
  {
    name: 'all fields (private)',
    description: 'Everything filled out but still private.',
    coverUrl: 'https://example.com/private-full.png',
    isPublic: false,
  },
  {
    name: 'title only (public)',
    description: '',
    coverUrl: '',
    isPublic: true,
  },
  {
    name: 'title and description (public)',
    description: 'Public map with description.',
    coverUrl: '',
    isPublic: true,
  },
  {
    name: 'title and cover image (public)',
    description: '',
    coverUrl: 'https://example.com/cover-public.png',
    isPublic: true,
  },
  {
    name: 'all fields (public)',
    description: 'Everything filled out and public.',
    coverUrl: 'https://example.com/public-full.png',
    isPublic: true,
  },
] as const;

const resolveOptional = (value: string) => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
};

const toMapRecord = (payload: MapInsertPayload): MapRecord => {
  const timestamp = new Date().toISOString();
  return {
    id: `map-${Math.random().toString(16).slice(2, 10)}`,
    owner_id: payload.owner_id,
    title: payload.title,
    description: payload.description,
    is_public: payload.is_public,
    cover_url: payload.cover_url,
    created_at: timestamp,
    updated_at: timestamp,
  };
};

const setupSupabaseMock = async (page: Page) => {
  const createRequests: MapInsertPayload[] = [];
  const createdMaps: MapRecord[] = [];

  const fulfillNoContent = (route: Route) =>
    route.fulfill({
      status: 204,
      headers: corsHeaders,
      body: '',
    });

  const fulfillJson = (route: Route, body: unknown, status = 200) =>
    route.fulfill({
      status,
      headers: {
        ...corsHeaders,
        'content-type': 'application/json',
      },
      body: body === null ? 'null' : JSON.stringify(body),
    });

  await page.addInitScript(
    ({ storageKey, session }) => {
      const persisted = {
        currentSession: session,
        currentUser: session.user,
        expiresAt: session.expires_at,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(persisted));
    },
    { storageKey: SUPABASE_STORAGE_KEY, session: fakeSession },
  );

  await page.route('**/auth/v1/**', (route) => {
    const { method, url } = route.request();

    if (method === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    if (url.includes('/auth/v1/user')) {
      return fulfillJson(route, fakeUser);
    }

    if (url.includes('/auth/v1/token')) {
      return fulfillJson(route, fakeSession);
    }

    return fulfillJson(route, { message: 'ok' });
  });

  await page.route('**/rest/v1/rpc/accept_map_invites', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    return fulfillJson(route, null);
  });

  await page.route('**/rest/v1/profiles', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    return fulfillJson(route, [fakeProfile]);
  });

  await page.route('**/rest/v1/map_members', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    return fulfillJson(route, []);
  });

  await page.route('**/rest/v1/locations', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    return fulfillJson(route, []);
  });

  await page.route('**/rest/v1/reviews', (route) => {
    if (route.request().method() === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    return fulfillJson(route, []);
  });

  await page.route('**/rest/v1/maps', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'OPTIONS') {
      return fulfillNoContent(route);
    }

    if (method === 'GET') {
      return fulfillJson(route, createdMaps);
    }

    if (method === 'POST') {
      const postData = request.postData();
      const asJson = postData ? JSON.parse(postData) : {};
      const rawPayload = Array.isArray(asJson) ? asJson[0] : asJson;

      const payload: MapInsertPayload = {
        owner_id: rawPayload.owner_id,
        title: rawPayload.title,
        description: rawPayload.description ?? null,
        is_public: rawPayload.is_public ?? false,
        cover_url: rawPayload.cover_url ?? null,
      };

      createRequests.push(payload);

      const record = toMapRecord(payload);
      createdMaps.push(record);

      return fulfillJson(route, record, 201);
    }

    return fulfillJson(route, createdMaps);
  });

  return {
    getCreateRequests: () => createRequests,
    getCreatedMaps: () => createdMaps,
  };
};

test.describe('Map creation', () => {
  for (const [index, scenario] of mapScenarios.entries()) {
    test(`allows ${scenario.name}`, async ({ page }) => {
      const supabase = await setupSupabaseMock(page);
      await page.goto('/app/dashboard');

      const newMapButton = page.getByRole('button', { name: /new map/i });
      await expect(newMapButton).toBeVisible();
      await newMapButton.click();

      const dialog = page.getByRole('dialog', { name: /create a map/i });
      await expect(dialog).toBeVisible();

      const title = `E2E Test Map ${index + 1}`;

      await dialog.getByLabel('Title').fill(title);

      const descriptionField = dialog.getByLabel('Description');
      if (scenario.description) {
        await descriptionField.fill(scenario.description);
      } else {
        await descriptionField.fill('');
      }

      const coverField = dialog.getByLabel('Cover image URL');
      if (scenario.coverUrl) {
        await coverField.fill(scenario.coverUrl);
      } else {
        await coverField.fill('');
      }

      const visibilitySwitch = dialog.getByRole('switch', { name: /public visibility/i });
      const shouldBeChecked = scenario.isPublic;
      const currentState = await visibilitySwitch.getAttribute('data-state');
      if (shouldBeChecked && currentState !== 'checked') {
        await visibilitySwitch.click();
      }
      if (!shouldBeChecked && currentState === 'checked') {
        await visibilitySwitch.click();
      }
      await expect(visibilitySwitch).toHaveAttribute(
        'data-state',
        shouldBeChecked ? 'checked' : 'unchecked',
      );

      await dialog.getByRole('button', { name: /create map/i }).click();

      await expect(dialog).toBeHidden();

      await expect.poll(() => supabase.getCreateRequests().length).toBe(1);

      const [inserted] = supabase.getCreateRequests();
      expect(inserted.title).toBe(title);
      expect(inserted.owner_id).toBe(fakeUser.id);
      expect(inserted.description).toBe(resolveOptional(scenario.description));
      expect(inserted.cover_url).toBe(resolveOptional(scenario.coverUrl));
      expect(inserted.is_public).toBe(scenario.isPublic);

      const visibilityBadge = page.getByText(scenario.isPublic ? 'Public' : 'Private');
      await expect(visibilityBadge.first()).toBeVisible();

      await expect(page.getByText(title)).toBeVisible();
      if (scenario.description) {
        await expect(page.getByText(scenario.description)).toBeVisible();
      }
    });
  }
});



