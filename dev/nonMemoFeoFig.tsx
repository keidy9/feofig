import React, {useEffect} from 'react';
import LazyLoad from './utils/lazyload';
import Debounce from './utils/debounce';
import Throttle from './utils/throttle';
import validateConfigs from './types/validateConfig';
import {FigProps} from './types/types';

const Fig = ({children, config, placeholder}: FigProps) => {
  useEffect(() => {
    // tests to see if user inputs for config are valid, throws error if not
    validateConfigs(config);
  }, [config]);

  // might get rid of these since it doesn't type guard well
  const isLazyLoadEnabled = config && config.lazyload;
  const isDebounceEnabled = config && config.debounce;
  const isThrottleEnabled = config && config.throttle;

  // recursively iterates through elements to find desired type to wrap
  // worried about how this will affect performance especially with deeply nested component trees. maybe memoization or a hook to trigger selectively
  const elementIsolator = (node: React.ReactNode): React.ReactNode => {
    // check if the node is a Fig component, if so then ignore Fig
    if (React.isValidElement(node) && node.type === Fig) {
      return node;
    }

    // might need to add a check here for other custom non-native wrappers

    // preserves non-element nodes like strings
    if (!React.isValidElement(node)) return node;

    // if node is an image, wrap it with LazyLoad
    if (isLazyLoadEnabled) {
      if (node.type === 'img') {
        return (
          <LazyLoad
            key={crypto.randomUUID()}
            threshold={config.lazyload?.threshold || 0} // default: 0
            placeholder={placeholder}
            once={config.lazyload?.once !== false} // default: false
            offset={config.lazyload?.offset || '0px'} // default: '0px'
          >
            {node}
          </LazyLoad>
        );
      }
    }

    // still need to filter by config.target
    if (isDebounceEnabled) {
      if (Array.isArray(config.debounce?.target)) {
      } else if ((node as React.ReactElement).type === 'input') {
        return (
          <>
            <Debounce
              onChange={(node as React.ReactElement).props.onChange}
              minLength={config.debounce?.minLength || 0}
              // there is a bug when delay is set to 100, idk why yet so adding 1 ms if user sets it to 100
              debounceTimeout={
                config.debounce?.delay === undefined ||
                config.debounce?.delay === 100
                  ? 101
                  : config.debounce?.delay
              }
            >
              {node}
            </Debounce>
          </>
        );
        // default if array is not provided
        // add debounceing/throttling depending on which is enabled and return
      } // maybe account for other handlers besides button
    }

    // still need to filter by config.target
    if (isThrottleEnabled) {
      if (Array.isArray(config.throttle?.target)) {
      } else if ((node as React.ReactElement).type === 'input') {
        return (
          <>
            <Throttle
              onChange={(node as React.ReactElement).props.onChange}
              minLength={config.throttle?.minLength || 0}
              throttleTimeout={
                config.throttle?.delay === undefined
                  ? 100
                  : config.throttle?.delay
              }
            >
              {node}
            </Throttle>
          </>
        );
        // default if array is not provided
        // add debounceing/throttling depending on which is enabled and return
      } // maybe account for other handlers besides button
    }

    // can filter for more node types and apply other wrappers below:

    // if node has children, recursively transform them to fit react props children array format
    if (node.props && (node as React.ReactElement).props.children) {
      const children = React.Children.toArray(
        (node as React.ReactElement).props.children
      ).map(elementIsolator);

      return React.cloneElement(node as React.ReactElement, {
        ...node.props,
        children: children,
      });
    }

    return node;
  };

  // calls recursive function to apply FEO wrappers to each child
  const wrapper = (child: React.ReactElement, index: number) => {
    if (!React.isValidElement(child)) {
      return child;
    }

    // calls recursive function, add more checks here if necessary
    if (isLazyLoadEnabled || isDebounceEnabled || isThrottleEnabled) {
      return elementIsolator(child) || child;
    }
  };

  return (
    <>
      {React.Children.map(children, (child, index) => {
        return wrapper(child, index);
      })}
    </>
  );
};

export default Fig;