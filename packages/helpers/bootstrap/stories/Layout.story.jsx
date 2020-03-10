import React from 'react';

const LORUM = 'Bacon ipsum dolor amet alcatra landjaeger hamburger sausage, pork chop tail shank turducken beef shankle t-bone frankfurter.';

const Layout = () => (
  <div className='storybook-app storybook-app--container-full font-standard ' data-b-layout='container'>
    <div data-b-layout='row'>
      <div data-b-layout='col full'>
        <h1 className='h1'>Component Layout</h1>
        <small>Component Layout built using data attributes: <code>data-b-layout</code></small>
        <p>The Primary use is to layout components</p>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Columns (Auto-Width)</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='col'>
            <div className={'layout-demo--content'}>col</div>
          </div>
          <div data-b-layout='col'>
            <div className={'layout-demo--content'}>col</div>
          </div>
          <div data-b-layout='col'>
            <div className={'layout-demo--content'}>col</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Columns (Set Width)</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/4'>
            <div className={'layout-demo--content'}>col 1/4</div>
          </div>
          <div data-b-layout='col 3/4'>
            <div className={'layout-demo--content'}>col 3/4</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>col 1/3</div>
          </div>
          <div data-b-layout='col 2/3'>
            <div className={'layout-demo--content'}>col 2/3</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/2'>
            <div className={'layout-demo--content'}>col 1/2</div>
          </div>
          <div data-b-layout='col 2/2'>
            <div className={'layout-demo--content'}>col 1/2</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col full'>
            <div className={'layout-demo--content'}>col full</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col 7/12'>
            <div className={'layout-demo--content'}>col 7/12</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Fit & Fill Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='fit'>
            <div className={'layout-demo--content'}>fit</div>
          </div>
          <div data-b-layout='fill'>
            <div className={'layout-demo--content'}>fill</div>
          </div>
          <div data-b-layout='fill 1/4'>
            <div className={'layout-demo--content'}>fill 1/4</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Responsive Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/2@sm '>
            <div className={'layout-demo--content'}>col 1/2@sm</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/3@md '>
            <div className={'layout-demo--content'}>col 1/3@md</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/4@lg'>
            <div className={'layout-demo--content'}>col 1/4@lg</div>
          </div>
        </div>
      </div>


      <h2 className="h2 " data-b-layout='col 1/4'>Stacking Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='col 1/2 full@md'>
            <div className={'layout-demo--content'}>col 1/2 full@md</div>

          </div>
          <div data-b-layout='col 1/2 full@md'>
            <div className={'layout-demo--content'}>col 1/2 full@md</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Offsets</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col  3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='col offset-1/4'>
            <div className={'layout-demo--content'}>col offset-1/4</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col offset-1/3'>
            <div className={'layout-demo--content'}>col offset-1/43</div>
          </div>
        </div>
        <div data-b-layout='row'>
          <div data-b-layout='col offset-1/2'>
            <div className={'layout-demo--content'}>col offset-1/2</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Nesting Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row'>
          <div data-b-layout='col'>
            <div className={'layout-demo--content'}>col</div>
          </div>
          <div data-b-layout='col row'>
            <div data-b-layout='col'>
              <div className={'layout-demo--content'}>col</div>
            </div>
            <div data-b-layout='col'>
              <div className={'layout-demo--content'}>col</div>
            </div>
            <div data-b-layout='col'>
              <div className={'layout-demo--content'}>col</div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Aligning Rows</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row start' style={{ height: '100px', marginBottom: '5px' }}>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row start &gt; col</div>
          </div>
          <div data-b-layout='col 1/3 '>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
        <div data-b-layout='row middle' style={{ height: '100px', marginBottom: '5px' }}>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row center &gt; col</div>
          </div>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
        <div data-b-layout='row end' style={{ height: '100px', marginBottom: '5px' }}>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row end &gt; col</div>
          </div>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
      </div>


      <h2 className="h2 " data-b-layout='col 1/4'>Aligning Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row between'>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row between &gt; col</div>
          </div>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
        <div data-b-layout='row center'>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row center &gt; col</div>
          </div>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
        <div data-b-layout='row around'>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row around &gt; col</div>
          </div>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
        <div data-b-layout='row stretch'>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>row stretch &gt; col</div>
          </div>
          <div data-b-layout='col 1/3'>
            <div className={'layout-demo--content'}>{LORUM}</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Hiding Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row '>
          <div data-b-layout='col hide'>
            <div className={'layout-demo--content'}>col hide</div>
          </div>
          <div data-b-layout='col hide@xs-only'>
            <div className={'layout-demo--content'}>col hide@xs-only</div>
          </div>
          <div data-b-layout='col hide@sm'>
            <div className={'layout-demo--content'}>col hide@sm</div>
          </div>
          <div data-b-layout='col hide@sm-only'>
            <div className={'layout-demo--content'}>col hide@sm-only</div>
          </div>
          <div data-b-layout='col hide@md'>
            <div className={'layout-demo--content'}>col hide@md</div>
          </div>
        </div>
        <div data-b-layout='row '>
          <div data-b-layout='col hide@md-only'>
            <div className={'layout-demo--content'}>col hide@md-only</div>
          </div>
          <div data-b-layout='col hide@lg'>
            <div className={'layout-demo--content'}>col hide@lg</div>
          </div>
          <div data-b-layout='col hide@lg-only'>
            <div className={'layout-demo--content'}>col hide@lg-only</div>
          </div>
        </div>
      </div>

      <h2 className="h2 " data-b-layout='col 1/4'>Padding Columns</h2>

      <div className='storybook-app__demo bolt-grids ' data-b-layout='col 3/4'>
        <div data-b-layout='row '>
          <div data-b-layout='col pad'>
            <div className={'layout-demo--content'}>col pad</div>
          </div>
          <div data-b-layout='col pad'>
            <div className={'layout-demo--content'}>col pad</div>
          </div>
          <div data-b-layout='col pad'>
            <div className={'layout-demo--content'}>col pad</div>
          </div>
        </div>
        <div data-b-layout='row negative'>
          <div data-b-layout='col pad'>
            <div className={'layout-demo--content'}>row negative &gt; col pad</div>
          </div>
          <div data-b-layout='col pad'>
            <div className={'layout-demo--content'}>row negative &gt; col pad</div>
          </div>
          <div data-b-layout='col pad'>
            <div className={'layout-demo--content'}>row negative &gt; col pad</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
export default Layout;
