import React from 'react';
import { act } from 'react-dom/test-utils';
import {
  mountWithContexts,
  waitForElement,
} from '../../../../../testUtils/enzymeHelpers';
import { SettingsProvider } from '../../../../contexts/Settings';
import { SettingsAPI, ExecutionEnvironmentsAPI } from '../../../../api';
import {
  assertDetail,
  assertVariableDetail,
} from '../../shared/settingTestUtils';
import mockAllOptions from '../../shared/data.allSettingOptions.json';
import MiscSystemDetail from './MiscSystemDetail';

jest.mock('../../../../api');

describe('<MiscSystemDetail />', () => {
  let wrapper;

  beforeEach(async () => {
    SettingsAPI.readCategory = jest.fn();
    SettingsAPI.readCategory.mockResolvedValue({
      data: {
        ALLOW_OAUTH2_FOR_EXTERNAL_USERS: false,
        AUTH_BASIC_ENABLED: true,
        AUTOMATION_ANALYTICS_GATHER_INTERVAL: 14400,
        AUTOMATION_ANALYTICS_URL: 'https://example.com',
        CUSTOM_VENV_PATHS: [],
        INSIGHTS_TRACKING_STATE: false,
        LOGIN_REDIRECT_OVERRIDE: 'https://redirect.com',
        MANAGE_ORGANIZATION_AUTH: true,
        OAUTH2_PROVIDER: {
          ACCESS_TOKEN_EXPIRE_SECONDS: 1,
          AUTHORIZATION_CODE_EXPIRE_SECONDS: 2,
          REFRESH_TOKEN_EXPIRE_SECONDS: 3,
        },
        ORG_ADMINS_CAN_SEE_ALL_USERS: true,
        REDHAT_PASSWORD: '$encrypted$',
        REDHAT_USERNAME: 'mock name',
        REMOTE_HOST_HEADERS: [],
        SESSIONS_PER_USER: -1,
        SESSION_COOKIE_AGE: 30000000000,
        TOWER_URL_BASE: 'https://towerhost',
        DEFAULT_EXECUTION_ENVIRONMENT: 1,
      },
    });
    ExecutionEnvironmentsAPI.readDetail = jest.fn();
    ExecutionEnvironmentsAPI.readDetail.mockResolvedValue({
      data: {
        id: 1,
        name: 'Foo',
        image: 'quay.io/ansible/awx-ee',
        pull: 'missing',
      },
    });
    await act(async () => {
      wrapper = mountWithContexts(
        <SettingsProvider value={mockAllOptions.actions}>
          <MiscSystemDetail />
        </SettingsProvider>
      );
    });
    await waitForElement(wrapper, 'ContentLoading', el => el.length === 0);
  });

  test('initially renders without crashing', () => {
    expect(wrapper.find('MiscSystemDetail').length).toBe(1);
  });

  test('should render expected tabs', () => {
    const expectedTabs = ['Back to Settings', 'Details'];
    wrapper.find('RoutedTabs li').forEach((tab, index) => {
      expect(tab.text()).toEqual(expectedTabs[index]);
    });
  });

  test('should render expected details', () => {
    assertDetail(wrapper, 'Access Token Expiration', '1 seconds');
    assertDetail(wrapper, 'All Users Visible to Organization Admins', 'On');
    assertDetail(
      wrapper,
      'Allow External Users to Create OAuth2 Tokens',
      'Off'
    );
    assertDetail(wrapper, 'Authorization Code Expiration', '2 seconds');
    assertDetail(
      wrapper,
      'Insights for Ansible Gather Interval',
      '14400 seconds'
    );
    assertDetail(
      wrapper,
      'Insights for Ansible upload URL',
      'https://example.com'
    );
    assertDetail(wrapper, 'Base URL of the service', 'https://towerhost');
    assertDetail(wrapper, 'Enable HTTP Basic Auth', 'On');
    assertDetail(wrapper, 'Gather data for Insights for Ansible', 'Off');
    assertDetail(wrapper, 'Idle Time Force Log Out', '30000000000 seconds');
    assertDetail(
      wrapper,
      'Login redirect override URL',
      'https://redirect.com'
    );
    assertDetail(
      wrapper,
      'Maximum number of simultaneous logged in sessions',
      '-1'
    );
    assertDetail(
      wrapper,
      'Organization Admins Can Manage Users and Teams',
      'On'
    );
    assertDetail(wrapper, 'Red Hat customer password', 'Encrypted');
    assertDetail(wrapper, 'Red Hat customer username', 'mock name');
    assertDetail(wrapper, 'Refresh Token Expiration', '3 seconds');
    assertVariableDetail(wrapper, 'Remote Host Headers', '[]');
    assertDetail(wrapper, 'Global default execution environment', 'Foo');
  });

  test('should render execution environment as not configured', async () => {
    ExecutionEnvironmentsAPI.readDetail.mockResolvedValue({
      data: {},
    });
    let newWrapper;
    await act(async () => {
      newWrapper = mountWithContexts(
        <SettingsProvider
          value={{
            ...mockAllOptions.actions,
            DEFAULT_EXECUTION_ENVIRONMENT: null,
          }}
        >
          <MiscSystemDetail />
        </SettingsProvider>
      );
    });
    await waitForElement(newWrapper, 'ContentLoading', el => el.length === 0);

    assertDetail(
      newWrapper,
      'Global default execution environment',
      'Not configured'
    );
  });

  test('should hide edit button from non-superusers', async () => {
    const config = {
      me: {
        is_superuser: false,
      },
    };
    await act(async () => {
      wrapper = mountWithContexts(
        <SettingsProvider value={mockAllOptions.actions}>
          <MiscSystemDetail />
        </SettingsProvider>,
        {
          context: { config },
        }
      );
    });
    await waitForElement(wrapper, 'ContentLoading', el => el.length === 0);
    expect(wrapper.find('Button[aria-label="Edit"]').exists()).toBeFalsy();
  });

  test('should display content error when api throws error on initial render', async () => {
    SettingsAPI.readCategory.mockRejectedValue(new Error());
    await act(async () => {
      wrapper = mountWithContexts(
        <SettingsProvider value={mockAllOptions.actions}>
          <MiscSystemDetail />
        </SettingsProvider>
      );
    });
    await waitForElement(wrapper, 'ContentLoading', el => el.length === 0);
    expect(wrapper.find('ContentError').length).toBe(1);
  });
});
