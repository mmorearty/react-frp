/**
 * Classes Value<T> and FRPComponent go together, and are two sides of
 * the same coin. A Value<T> holds a value that can be queried by FRPComponents;
 * an FRPComponent is a React component that can query Values.
 *
 * An FRPComponent queries the value of a Value<T> with `this.get(valueObj)`:
 *
 *     class MyComponent extends FRPComponent {
 *         constructor(someValue: Value<number>) { this.someValue = someValue; }
 *         render() {
 *             var x = this.get(this.someValue);
 *         }
 *         ...
 *     }
 *
 * Whenever a Value's value changes, its calls forceUpdate() on all components
 * that have previously queried the value.
 *
 * When the FRPComponent unmounts, it unregisters itself from all Values.
 */

/**
 * Value<T>: A wrapper around a value, which can be read by an FRPComponent. If
 * the value changes, all FRPComponents that have queried the value will have
 * their forceUpdate() called.
 */
class Value<T> {
  _value: T;
  _reactComponents: Set<ReactComponent>;
  constructor(value: T) {
    this._value = value;
    this._reactComponents = new Set();
  }
  get(comp: ReactComponent = undefined): T {
    if (comp !== undefined && comp !== null) {
      this.register(comp);
    }
    return this._value;
  }
  set(value: T) {
    if (!value !== this._value) {
      this._value = value;
      // Call forceUpdate() on every react component that checks this value
      this._reactComponents.forEach(comp => comp.forceUpdate());
    }
  }

  register(comp: ReactComponent) {
    this._reactComponents.add(comp);
  }
  unregister(comp: ReactComponent) {
    this._reactComponents.delete(comp);
  }
}

/**
 * FRPComponent: A React component that can query Value<T>'s. To query a Value<T>,
 * an FRPComponent must use `this.get(some_value)`.
 */
class FRPComponent extends React.Component {
  _values: Set<Value<any>>;

  get(value: Value<T>): T {
    this._values.add(value);
    return value.get(this);
  }

  componentWillMount() {
    this._values = new Set();
  }
  componentWillUnmount() {
    this._values.forEach(value => value.unregister(this));
    this._values = null;
  }
}

////////////////////////////////////////////////////////////////////////////////

// window.counter: A Value
window.currentTime = new Value(new Date());

// increments window.currentTime
setInterval(function() {
  window.currentTime.set(new Date());
}, 1);


class HelloWorld extends FRPComponent {
  constructor(props) {
    super(props);
    this.state = {counter:1};
  }

  incrementStateCounter() {
    this.setState({counter: this.state.counter + 1});
  }

  render() {
    return <div>
      <div>this.state.counter = {this.state.counter}</div>
      <div>window.currentTime = {""+this.get(window.currentTime)}</div>
      <div><button onClick={this.incrementStateCounter.bind(this)}>Increment this.state.counter</button></div>
    </div>;
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only checks state.counter; does not check window.currentTime. But since window.currentTime is
    // a Value, when it changes it automatically calls our forceUpdate(), so there is no need
    // to specify it here in shouldComponentUpdate().
    return nextState.counter != this.state.counter;
  }
}

window.App.HelloWorld = HelloWorld;

/* vim:set et ts=2 sw=2: */
