import React from 'react';
import { Wizard } from '@patternfly/react-core';

import { t } from '@lingui/macro';
import { Formik, useFormikContext } from 'formik';
import ContentError from '../ContentError';
import ContentLoading from '../ContentLoading';
import { useDismissableError } from '../../util/useRequest';
import mergeExtraVars from '../../util/prompt/mergeExtraVars';
import getSurveyValues from '../../util/prompt/getSurveyValues';
import useLaunchSteps from './useLaunchSteps';
import AlertModal from '../AlertModal';

function PromptModalForm({
  launchConfig,
  onCancel,
  onSubmit,
  resource,
  surveyConfig,
  resourceDefaultCredentials,
}) {
  const { setFieldTouched, values } = useFormikContext();

  const {
    steps,
    isReady,
    validateStep,
    visitStep,
    visitAllSteps,
    contentError,
  } = useLaunchSteps(
    launchConfig,
    surveyConfig,
    resource,
    resourceDefaultCredentials
  );

  const handleSubmit = () => {
    const postValues = {};
    const setValue = (key, value) => {
      if (typeof value !== 'undefined' && value !== null) {
        postValues[key] = value;
      }
    };
    const surveyValues = getSurveyValues(values);
    setValue('credential_passwords', values.credential_passwords);
    setValue('inventory_id', values.inventory?.id);
    setValue(
      'credentials',
      values.credentials?.map(c => c.id)
    );
    setValue('job_type', values.job_type);
    setValue('limit', values.limit);
    setValue('job_tags', values.job_tags);
    setValue('skip_tags', values.skip_tags);
    const extraVars = launchConfig.ask_variables_on_launch
      ? values.extra_vars || '---'
      : resource.extra_vars;
    setValue('extra_vars', mergeExtraVars(extraVars, surveyValues));
    setValue('scm_branch', values.scm_branch);

    onSubmit(postValues);
  };
  const { error, dismissError } = useDismissableError(contentError);

  if (error) {
    return (
      <AlertModal
        isOpen={error}
        variant="error"
        title={t`Error!`}
        onClose={() => {
          dismissError();
        }}
      >
        <ContentError error={error} />
      </AlertModal>
    );
  }

  return (
    <Wizard
      isOpen
      onClose={onCancel}
      onSave={handleSubmit}
      onBack={async nextStep => {
        validateStep(nextStep.id);
      }}
      onNext={async (nextStep, prevStep) => {
        if (nextStep.id === 'preview') {
          visitAllSteps(setFieldTouched);
        } else {
          visitStep(prevStep.prevId, setFieldTouched);
          validateStep(nextStep.id);
        }
      }}
      onGoToStep={async (nextStep, prevStep) => {
        if (nextStep.id === 'preview') {
          visitAllSteps(setFieldTouched);
        } else {
          visitStep(prevStep.prevId, setFieldTouched);
          validateStep(nextStep.id);
        }
      }}
      title={t`Prompts`}
      steps={
        isReady
          ? steps
          : [
              {
                name: t`Content Loading`,
                component: <ContentLoading />,
              },
            ]
      }
      backButtonText={t`Back`}
      cancelButtonText={t`Cancel`}
      nextButtonText={t`Next`}
    />
  );
}

function LaunchPrompt({
  launchConfig,
  onCancel,
  onLaunch,
  resource = {},
  surveyConfig,
  resourceDefaultCredentials = [],
}) {
  return (
    <Formik initialValues={{}} onSubmit={values => onLaunch(values)}>
      <PromptModalForm
        onSubmit={values => onLaunch(values)}
        onCancel={onCancel}
        launchConfig={launchConfig}
        surveyConfig={surveyConfig}
        resource={resource}
        resourceDefaultCredentials={resourceDefaultCredentials}
      />
    </Formik>
  );
}

export { LaunchPrompt as _LaunchPrompt };
export default LaunchPrompt;
