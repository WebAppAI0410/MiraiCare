import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HealthChart } from '../../src/components/HealthChart';
import { StepData, MoodData } from '../../src/types';

// react-native-chart-kitのモック
jest.mock('react-native-chart-kit', () => ({
  LineChart: ({ data, ...props }: any) => {
    const testID = props.testID || 'line-chart';
    return <mockLineChart 
      testID={testID} 
      data={JSON.stringify(data)}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={props.accessibilityRole}
    />;
  },
  BarChart: ({ data, ...props }: any) => {
    const testID = props.testID || 'bar-chart';
    return <mockBarChart 
      testID={testID} 
      data={JSON.stringify(data)}
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole={props.accessibilityRole}
    />;
  },
}));

// react-native-svgのモック
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Rect: 'Rect',
  Path: 'Path',
}));

describe('HealthChart', () => {
  const mockStepData: StepData[] = [
    { date: '2024-01-10', steps: 5000, userId: 'test-user' },
    { date: '2024-01-11', steps: 7000, userId: 'test-user' },
    { date: '2024-01-12', steps: 6000, userId: 'test-user' },
    { date: '2024-01-13', steps: 8000, userId: 'test-user' },
    { date: '2024-01-14', steps: 4000, userId: 'test-user' },
    { date: '2024-01-15', steps: 9000, userId: 'test-user' },
    { date: '2024-01-16', steps: 7500, userId: 'test-user' },
  ];

  const mockMoodData: MoodData[] = [
    { 
      id: '1', 
      userId: 'test-user', 
      mood: 80, 
      energy: 70, 
      createdAt: '2024-01-10T10:00:00Z',
      note: 'Good day'
    },
    { 
      id: '2', 
      userId: 'test-user', 
      mood: 60, 
      energy: 50, 
      createdAt: '2024-01-12T10:00:00Z',
      note: 'Okay'
    },
    { 
      id: '3', 
      userId: 'test-user', 
      mood: 90, 
      energy: 85, 
      createdAt: '2024-01-14T10:00:00Z',
      note: 'Great!'
    },
    { 
      id: '4', 
      userId: 'test-user', 
      mood: 70, 
      energy: 60, 
      createdAt: '2024-01-16T10:00:00Z',
      note: 'Fine'
    },
  ];

  it('歩数データのグラフを表示する', () => {
    render(
      <HealthChart 
        type="steps" 
        data={mockStepData}
        title="週間歩数"
      />
    );

    expect(screen.getByText('週間歩数')).toBeTruthy();
    expect(screen.getByTestId('steps-line-chart')).toBeTruthy();
  });

  it('気分データのグラフを表示する', () => {
    render(
      <HealthChart 
        type="mood" 
        data={mockMoodData}
        title="気分の推移"
      />
    );

    expect(screen.getByText('気分の推移')).toBeTruthy();
    expect(screen.getByTestId('mood-line-chart')).toBeTruthy();
  });

  it('データがない場合、メッセージを表示する', () => {
    render(
      <HealthChart 
        type="steps" 
        data={[]}
        title="週間歩数"
      />
    );

    expect(screen.getByText('データがありません')).toBeTruthy();
  });

  it('リスクトレンドグラフを表示する', () => {
    const mockRiskData = [
      { date: '2024-01-10', score: 30, level: 'low' as const },
      { date: '2024-01-11', score: 45, level: 'medium' as const },
      { date: '2024-01-12', score: 35, level: 'low' as const },
      { date: '2024-01-13', score: 60, level: 'high' as const },
      { date: '2024-01-14', score: 55, level: 'medium' as const },
      { date: '2024-01-15', score: 40, level: 'medium' as const },
      { date: '2024-01-16', score: 25, level: 'low' as const },
    ];

    render(
      <HealthChart 
        type="risk" 
        data={mockRiskData}
        title="リスクトレンド"
      />
    );

    expect(screen.getByText('リスクトレンド')).toBeTruthy();
    expect(screen.getByTestId('risk-line-chart')).toBeTruthy();
  });

  it('期間選択ができる', () => {
    render(
      <HealthChart 
        type="steps" 
        data={mockStepData}
        title="歩数推移"
        showPeriodSelector={true}
      />
    );

    expect(screen.getByText('1週間')).toBeTruthy();
    expect(screen.getByText('1ヶ月')).toBeTruthy();
    expect(screen.getByText('3ヶ月')).toBeTruthy();
  });

  it('平均値ラインを表示する', () => {
    render(
      <HealthChart 
        type="steps" 
        data={mockStepData}
        title="週間歩数"
        showAverage={true}
      />
    );

    // 平均値の計算: (5000+7000+6000+8000+4000+9000+7500) / 7 = 6642.86
    expect(screen.getByText('平均: 6,643歩')).toBeTruthy();
  });

  it('目標ラインを表示する', () => {
    render(
      <HealthChart 
        type="steps" 
        data={mockStepData}
        title="週間歩数"
        targetValue={8000}
      />
    );

    expect(screen.getByText('目標: 8,000歩')).toBeTruthy();
  });

  it('アクセシビリティ対応がされている', () => {
    render(
      <HealthChart 
        type="steps" 
        data={mockStepData}
        title="週間歩数"
      />
    );

    const chart = screen.getByTestId('steps-line-chart');
    expect(chart.props.accessibilityLabel).toBe('週間歩数のグラフ');
    expect(chart.props.accessibilityRole).toBe('image');
  });
});