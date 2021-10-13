import React from 'react';
import { AsyncSelect, Button, InlineField, InlineFieldRow, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps } from './types';
import { HostFilter, HostLabelsFilter, HostRegExFilter, ServiceFilter, ServiceRegExFilter, SiteFilter } from './site';
import { update } from 'lodash';

export const SelectAggregation = (props: EditorProps) => {
  const combined_presentations = [
    { value: 'lines', label: 'Lines' },
    { value: 'stacked', label: 'Stacked' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
  ];

  const onPresentationChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = props;
    onChange({ ...query, params: { ...query.params, presentation: value } });
    onRunQuery();
  };

  return (
    <InlineField label="Aggregation" labelWidth={14}>
      <Select
        width={32}
        options={combined_presentations}
        onChange={onPresentationChange}
        value={props.query.params.presentation}
        placeholder="Aggregation"
      />
    </InlineField>
  );
};

export const CombinedGraphSelect = ({ query, datasource, onChange, onRunQuery }: EditorProps) => {
  const getAutocomplete = (_inputValue: string) => datasource.combinedGraphIdent(query);
  const onSelection = ({ value }: SelectableValue<string>) => {
    update(query, 'params.graph_name', () => value);
    onChange(query);
    onRunQuery();
  };
  return (
    <InlineField labelWidth={14} label="Graph">
      <AsyncSelect onChange={onSelection} loadOptions={getAutocomplete} width={32} />
    </InlineField>
  );
};

export const FilterEditor = (props: EditorProps) => {
  const context = props.query.context || {};
  return (
    <>
      {Object.keys(context).map((filtername, index) => (
        <SelectFilters key={`${index}/${filtername}`} {...props} filtername={filtername} />
      ))}
      <SelectFilters {...props} filtername={''} />
    </>
  );
};

interface FilterEditorProps extends EditorProps {
  filtername: string;
}

export const SelectFilters = (props: FilterEditorProps) => {
  const all_filters = [
    { value: 'siteopt', label: 'Site', render: SiteFilter },
    { value: 'host', label: 'Hostname', render: HostFilter },
    { value: 'hostregex', label: 'Hostname regex', render: HostRegExFilter },
    { value: 'service', label: 'Service', render: ServiceFilter },
    { value: 'serviceregex', label: 'Service regex', render: ServiceRegExFilter },
    { value: 'host_labels', label: 'Host Labels', render: HostLabelsFilter },
  ];
  const context = props.query.context || {};
  const available_filters = all_filters.filter(
    ({ value }) => value === props.filtername || !context.hasOwnProperty(value)
  );
  // Early return in case all filters are on
  if (!available_filters.length) {
    return null;
  }

  const action = () => {
    const { onChange, query, filtername } = props;
    if (query.context) {
      delete query.context[filtername];
    }
    onChange(query);
  };

  const onFilterChange = ({ value }: SelectableValue<string | null>) => {
    const { onChange, query, filtername } = props;
    if (query.context) {
      delete query.context[filtername];
    }

    if (value) {
      onChange({ ...query, context: { ...query.context, [value]: {} } });
    }
  };

  const activeFilter = all_filters.find(({ value }) => value === props.filtername);

  return (
    <InlineFieldRow>
      <InlineField label="Filter" labelWidth={8}>
        <Select
          width={32}
          options={available_filters}
          onChange={onFilterChange}
          value={props.filtername || null}
          placeholder="Filter"
        />
      </InlineField>
      {activeFilter && (
        <>
          <Button icon="minus" variant="secondary" onClick={action} />
          <activeFilter.render {...props} />
        </>
      )}
    </InlineFieldRow>
  );
};