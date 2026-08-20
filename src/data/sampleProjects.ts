import { Project } from '../types';

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'proj_saas_launch',
    name: 'SaaS Platform 2.0 Launch',
    description: 'Full-cycle product release including UI/UX redesign, core API rewrite, QA testing with buffer, and marketing push.',
    startDate: '2026-09-01',
    useWorkingDaysOnly: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    tasks: [
      {
        id: 't_user_research',
        name: 'User Research & Wireframing',
        duration: 8,
        dependencies: [],
        bufferDays: 0,
        category: 'Product & Design',
        owner: 'Elena Vance',
        notes: 'Interviews with 25 enterprise beta users and IA mapping'
      },
      {
        id: 't_ui_design',
        name: 'High-Fidelity UI System & Design Tokens',
        duration: 12,
        dependencies: ['t_user_research'],
        bufferDays: 2,
        category: 'Product & Design',
        owner: 'Marcus Brody',
        notes: 'Figma component library and accessibility color audit'
      },
      {
        id: 't_api_architecture',
        name: 'Core Database Schema & Auth Microservice',
        duration: 10,
        dependencies: [],
        bufferDays: 0,
        category: 'Backend',
        owner: 'Devon Miles',
        notes: 'PostgreSQL migration, Redis session cache, OAuth2'
      },
      {
        id: 't_backend_engine',
        name: 'Core Business Logic & Payment Webhooks',
        duration: 15,
        dependencies: ['t_api_architecture'],
        bufferDays: 3,
        category: 'Backend',
        owner: 'Devon Miles',
        notes: 'Stripe webhook listener, simulation computation engine'
      },
      {
        id: 't_frontend_build',
        name: 'Frontend Application & Gantt Components',
        duration: 14,
        dependencies: ['t_ui_design', 't_api_architecture'],
        bufferDays: 0,
        category: 'Frontend',
        owner: 'Aria Chen',
        notes: 'React state engine, interactive timeline, responsive drawer'
      },
      {
        id: 't_qa_testing',
        name: 'Integration Testing & Regression Suite',
        duration: 7,
        dependencies: ['t_backend_engine', 't_frontend_build'],
        bufferDays: 4, // Absorbs up to 4 days of slip!
        category: 'QA & Security',
        owner: 'Lucas Silva',
        notes: 'Automated Cypress E2E tests, load testing 5k concurrent users'
      },
      {
        id: 't_security_audit',
        name: 'Third-Party SOC2 & Pen-Test Audit',
        duration: 6,
        dependencies: ['t_backend_engine'],
        bufferDays: 2,
        category: 'QA & Security',
        owner: 'SecOps Team',
        notes: 'OWASP Top 10 vulnerability scan and compliance review'
      },
      {
        id: 't_marketing_prep',
        name: 'Product Hunt & Press Release Assets',
        duration: 8,
        dependencies: ['t_ui_design'],
        bufferDays: 5,
        category: 'Marketing',
        owner: 'Chloe Bennett',
        notes: 'Video demo trailers, newsletter broadcast, social graphics'
      },
      {
        id: 't_cloud_infra',
        name: 'Production Kubernetes Cluster & CDN Warmup',
        duration: 4,
        dependencies: ['t_qa_testing', 't_security_audit'],
        bufferDays: 1,
        category: 'DevOps',
        owner: 'Tariq Al-Mansoor',
        notes: 'Cloud Run / K8s auto-scaling policies, SSL certificates'
      },
      {
        id: 't_final_launch',
        name: 'Public Go-Live & DNS Cutover',
        duration: 2,
        dependencies: ['t_cloud_infra', 't_marketing_prep'],
        bufferDays: 0,
        category: 'Milestone',
        owner: 'All Teams',
        notes: 'Global DNS propagation, live traffic switch, war room monitoring'
      }
    ]
  },
  {
    id: 'proj_mobile_app',
    name: 'iOS & Android Mobile App Release',
    description: 'Cross-platform mobile application development, App Store review, and launch campaign.',
    startDate: '2026-09-15',
    useWorkingDaysOnly: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    tasks: [
      {
        id: 'm_specs',
        name: 'Product Requirements & API Contract',
        duration: 5,
        dependencies: [],
        bufferDays: 0,
        category: 'Product',
        owner: 'Sarah Jenkins'
      },
      {
        id: 'm_native_bridge',
        name: 'Mobile Core SDK & Bluetooth Integration',
        duration: 10,
        dependencies: ['m_specs'],
        bufferDays: 2,
        category: 'Engineering',
        owner: 'Kenji Sato'
      },
      {
        id: 'm_screens',
        name: 'Onboarding & Checkout Screen Flows',
        duration: 12,
        dependencies: ['m_specs'],
        bufferDays: 0,
        category: 'Design & UI',
        owner: 'Maya Lin'
      },
      {
        id: 'm_beta_test',
        name: 'TestFlight Internal Beta (100 testers)',
        duration: 7,
        dependencies: ['m_native_bridge', 'm_screens'],
        bufferDays: 3,
        category: 'QA',
        owner: 'Kenji Sato'
      },
      {
        id: 'm_app_store_review',
        name: 'Apple App Store & Google Play Review',
        duration: 5,
        dependencies: ['m_beta_test'],
        bufferDays: 2,
        category: 'Compliance',
        owner: 'Sarah Jenkins'
      },
      {
        id: 'm_mobile_launch',
        name: 'App Store Global Availability',
        duration: 1,
        dependencies: ['m_app_store_review'],
        bufferDays: 0,
        category: 'Milestone',
        owner: 'All Teams'
      }
    ]
  },
  {
    id: 'proj_ecommerce_replatform',
    name: 'E-Commerce Re-Platforming & Black Friday Prep',
    description: 'Migrating legacy catalog database, new checkout UX, payment gateway update, and performance load tests.',
    startDate: '2026-10-01',
    useWorkingDaysOnly: true,
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    tasks: [
      {
        id: 'ec_data_migration',
        name: 'Extract & Clean Legacy SKU Catalog',
        duration: 14,
        dependencies: [],
        bufferDays: 3,
        category: 'Data Engineering',
        owner: 'Liam O’Connor'
      },
      {
        id: 'ec_checkout_ux',
        name: '1-Click Checkout & Apple Pay Integration',
        duration: 10,
        dependencies: [],
        bufferDays: 1,
        category: 'Frontend',
        owner: 'Zara Patel'
      },
      {
        id: 'ec_inventory_sync',
        name: 'Real-Time ERP Inventory Webhooks',
        duration: 12,
        dependencies: ['ec_data_migration'],
        bufferDays: 2,
        category: 'Backend',
        owner: 'Liam O’Connor'
      },
      {
        id: 'ec_load_testing',
        name: '100,000 RPM Stress & Chaos Testing',
        duration: 6,
        dependencies: ['ec_inventory_sync', 'ec_checkout_ux'],
        bufferDays: 4,
        category: 'QA',
        owner: 'DevOps Team'
      },
      {
        id: 'ec_switchover',
        name: 'Black Friday Production Launch',
        duration: 2,
        dependencies: ['ec_load_testing'],
        bufferDays: 0,
        category: 'Milestone',
        owner: 'Leadership'
      }
    ]
  }
];
