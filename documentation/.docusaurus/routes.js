import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/undefined/api',
    component: ComponentCreator('/undefined/api', 'ff3'),
    exact: true
  },
  {
    path: '/undefined/markdown-page',
    component: ComponentCreator('/undefined/markdown-page', '645'),
    exact: true
  },
  {
    path: '/undefined/docs',
    component: ComponentCreator('/undefined/docs', '525'),
    routes: [
      {
        path: '/undefined/docs',
        component: ComponentCreator('/undefined/docs', 'f55'),
        routes: [
          {
            path: '/undefined/docs',
            component: ComponentCreator('/undefined/docs', '3c1'),
            routes: [
              {
                path: '/undefined/docs/api-specification/calculator-model-generated',
                component: ComponentCreator('/undefined/docs/api-specification/calculator-model-generated', 'd04'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/api-specification/design-api-intro',
                component: ComponentCreator('/undefined/docs/api-specification/design-api-intro', '1e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/api-specification/openapi-spec',
                component: ComponentCreator('/undefined/docs/api-specification/openapi-spec', 'c13'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/category/api-specification',
                component: ComponentCreator('/undefined/docs/category/api-specification', 'fa9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/category/requirements-specification',
                component: ComponentCreator('/undefined/docs/category/requirements-specification', '179'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/category/system-architecture',
                component: ComponentCreator('/undefined/docs/category/system-architecture', '38b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/category/test-procedures',
                component: ComponentCreator('/undefined/docs/category/test-procedures', 'c9d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/intro',
                component: ComponentCreator('/undefined/docs/intro', 'da8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/requirements/features-and-requirements',
                component: ComponentCreator('/undefined/docs/requirements/features-and-requirements', 'd89'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/requirements/general-requirements',
                component: ComponentCreator('/undefined/docs/requirements/general-requirements', '2d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/requirements/system-block-diagram',
                component: ComponentCreator('/undefined/docs/requirements/system-block-diagram', '559'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/requirements/system-overview',
                component: ComponentCreator('/undefined/docs/requirements/system-overview', '403'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/requirements/use-case-descriptions',
                component: ComponentCreator('/undefined/docs/requirements/use-case-descriptions', 'a6b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/system-architecture/design',
                component: ComponentCreator('/undefined/docs/system-architecture/design', '1b8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/system-architecture/development-environment',
                component: ComponentCreator('/undefined/docs/system-architecture/development-environment', 'bce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/system-architecture/version-control',
                component: ComponentCreator('/undefined/docs/system-architecture/version-control', '73b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/testing/acceptence-testing',
                component: ComponentCreator('/undefined/docs/testing/acceptence-testing', '3ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/testing/integration-testing',
                component: ComponentCreator('/undefined/docs/testing/integration-testing', 'd46'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/docs/testing/unit-testing',
                component: ComponentCreator('/undefined/docs/testing/unit-testing', 'ac2'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/undefined/tutorial',
    component: ComponentCreator('/undefined/tutorial', '584'),
    routes: [
      {
        path: '/undefined/tutorial',
        component: ComponentCreator('/undefined/tutorial', '2bb'),
        routes: [
          {
            path: '/undefined/tutorial',
            component: ComponentCreator('/undefined/tutorial', '183'),
            routes: [
              {
                path: '/undefined/tutorial/category/custom-components',
                component: ComponentCreator('/undefined/tutorial/category/custom-components', 'cd0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/category/tutorial---basics',
                component: ComponentCreator('/undefined/tutorial/category/tutorial---basics', '25c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/category/tutorial---extras',
                component: ComponentCreator('/undefined/tutorial/category/tutorial---extras', '4c6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/custom-components/figure',
                component: ComponentCreator('/undefined/tutorial/custom-components/figure', '8d6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/intro',
                component: ComponentCreator('/undefined/tutorial/intro', '20a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/congratulations',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/congratulations', '8e0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/create-a-document',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/create-a-document', 'a78'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/create-a-page',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/create-a-page', 'dfb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/deploy-your-site',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/deploy-your-site', '41a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/markdown-features',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/markdown-features', 'd3b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/mermaid',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/mermaid', '1fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-basics/set-environment-variables',
                component: ComponentCreator('/undefined/tutorial/tutorial-basics/set-environment-variables', '56b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-extras/manage-docs-versions',
                component: ComponentCreator('/undefined/tutorial/tutorial-extras/manage-docs-versions', 'e37'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/undefined/tutorial/tutorial-extras/translate-your-site',
                component: ComponentCreator('/undefined/tutorial/tutorial-extras/translate-your-site', 'd11'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/undefined/',
    component: ComponentCreator('/undefined/', 'af6'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
